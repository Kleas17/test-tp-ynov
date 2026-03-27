describe('Docker live stack', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8000';
  const seededEmail = 'alice.dupont@ynov.local';

  const readRegisteredCount = () =>
    cy.get('[data-cy=registered-count]').invoke('text').then((text) => {
      const match = text.match(/(\d+)/);

      expect(match, 'registered users count').to.not.be.null;
      return Number(match[1]);
    });

  const fillRegistrationForm = (user) => {
    cy.get('[data-cy=nom]').clear().type(user.nom);
    cy.get('[data-cy=prenom]').clear().type(user.prenom);
    cy.get('[data-cy=email]').clear().type(user.email);
    cy.get('[data-cy=dateNaissance]').clear().type(user.dateNaissance);
    cy.get('[data-cy=cp]').clear().type(user.cp);
    cy.get('[data-cy=ville]').clear().type(user.ville);
  };

  beforeEach(() => {
    cy.resetTestData({ seed: true });
    cy.visit('/');
    cy.get('[data-cy=registered-count]').should('contain', 'utilisateur(s) inscrit(s)');
  });

  it('affiche les utilisateurs seeds exposes par l API reelle', () => {
    readRegisteredCount().should('be.greaterThan', 0);
    cy.get('[data-cy=registered-user]').should('have.length.at.least', 1);
    cy.contains('[data-cy=registered-user]', 'Dupont Alice').should('be.visible');
  });

  it('cree un utilisateur via le formulaire et persiste apres rechargement', () => {
    const uniqueUser = {
      nom: 'E2E',
      prenom: 'Live',
      email: `e2e.live.${Date.now()}@ynov.local`,
      dateNaissance: '1994-06-15',
      cp: '33000',
      ville: 'Bordeaux',
    };

    readRegisteredCount().then((initialCount) => {
      cy.get('[data-cy=go-to-register]').click();
      cy.location('pathname').should('eq', '/register');

      fillRegistrationForm(uniqueUser);
      cy.get('[data-cy=submit]').should('be.enabled').click();

      cy.location('pathname').should('eq', '/');
      cy.get('[data-cy=success]').should('contain', 'Inscription enregistr');
      cy.contains('[data-cy=registered-user]', `${uniqueUser.nom} ${uniqueUser.prenom}`).should('be.visible');
      readRegisteredCount().should('eq', initialCount + 1);

      cy.reload();
      cy.contains('[data-cy=registered-user]', `${uniqueUser.nom} ${uniqueUser.prenom}`).should('be.visible');
      readRegisteredCount().should('eq', initialCount + 1);

      cy.request(`${apiUrl}/users`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.some((user) => user.email === uniqueUser.email)).to.eq(true);
      });
    });
  });

  it('renvoie un message metier backend sur doublon email', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/users`,
      failOnStatusCode: false,
      body: {
        nom: 'Duplicate',
        prenom: 'User',
        email: seededEmail,
        dateNaissance: '1991-04-10',
        cp: '75001',
        ville: 'Paris',
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.deep.equal({
        message: 'Un utilisateur avec cet email existe deja.',
      });
    });
  });

  it('bloque les erreurs de validation sans mock reseau', () => {
    cy.get('[data-cy=go-to-register]').click();

    cy.get('[data-cy=nom]').type('Martin123').blur();
    cy.contains(/Caractères invalides dans le nom/i).should('be.visible');

    cy.get('[data-cy=email]').type('kleas3.marc@gma)l.com').blur();
    cy.contains("Format d'email invalide").should('be.visible');

    cy.get('[data-cy=cp]').type('75A').blur();
    cy.contains(/Code postal français invalide/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });
});
