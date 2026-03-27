describe('Navigation SPA contre la stack reelle', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8000';
  const user = {
    nom: 'Martin',
    prenom: 'Julie',
    email: 'julie.martin@example.com',
    dateNaissance: '1990-01-01',
    cp: '69001',
    ville: 'Lyon',
  };
  const secondUser = {
    nom: 'Durand',
    prenom: 'Luc',
    email: 'luc.durand@example.com',
    dateNaissance: '1989-03-03',
    cp: '75001',
    ville: 'Paris',
  };

  const visitHomeWithData = (payload = { seed: false, users: [] }) => {
    cy.resetTestData(payload);
    cy.visit('/');
    cy.get('[data-cy=home-page]').should('be.visible');
  };

  const goToRegister = () => {
    cy.get('[data-cy=go-to-register]').click();
    cy.location('pathname').should('eq', '/register');
  };

  const fillForm = (currentUser) => {
    cy.get('[data-cy=nom]').clear().type(currentUser.nom);
    cy.get('[data-cy=prenom]').clear().type(currentUser.prenom);
    cy.get('[data-cy=email]').clear().type(currentUser.email);
    cy.get('[data-cy=dateNaissance]').clear().type(currentUser.dateNaissance);
    cy.get('[data-cy=cp]').clear().type(currentUser.cp);
    cy.get('[data-cy=ville]').clear().type(currentUser.ville);
  };

  it('Scenario nominal: accueil vide -> formulaire -> inscription valide -> accueil mis a jour', () => {
    visitHomeWithData();

    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');

    goToRegister();
    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=success]').should('contain', 'Inscription enregistr');
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.contains('[data-cy=registered-user]', 'Martin Julie').should('be.visible');

    cy.request(`${apiUrl}/users`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.length(1);
      expect(response.body[0].email).to.eq(user.email);
    });
  });

  it('Scenario erreur: avec 1 inscrit -> tentative invalide -> accueil inchange', () => {
    visitHomeWithData({ seed: false, users: [user] });

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.contains('[data-cy=registered-user]', 'Martin Julie').should('be.visible');

    goToRegister();
    fillForm({
      ...secondUser,
      email: user.email,
    });

    cy.contains(/Cet email est d.*j.* utilis/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');

    cy.get('[data-cy=go-home]').click();
    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
  });

  it('persiste bien au rechargement navigateur via API reelle', () => {
    visitHomeWithData({ seed: false, users: [user] });

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.reload();
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.contains('[data-cy=registered-user]', 'Martin Julie').should('be.visible');
  });

  it('accepte plusieurs inscriptions et conserve la liste complete', () => {
    visitHomeWithData({ seed: false, users: [user] });

    goToRegister();
    fillForm(secondUser);
    cy.get('[data-cy=submit]').should('be.enabled').click();

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '2 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 2);
    cy.contains('[data-cy=registered-user]', 'Martin Julie').should('be.visible');
    cy.contains('[data-cy=registered-user]', 'Durand Luc').should('be.visible');
  });

  it('affiche le message metier backend sur erreur 400 sans mock', () => {
    visitHomeWithData();
    goToRegister();
    fillForm(user);

    cy.request('POST', `${apiUrl}/users`, user).its('status').should('eq', 201);

    cy.get('[data-cy=submit]').should('be.enabled').click();

    cy.location('pathname').should('eq', '/register');
    cy.get('[data-cy=success]').should('contain', 'Un utilisateur avec cet email existe deja.');
  });

  it('affiche une alerte utilisateur sur erreur serveur 500 sans mock', () => {
    visitHomeWithData();
    goToRegister();
    fillForm(user);
    cy.queueCreateUserFault(500);

    cy.get('[data-cy=submit]').should('be.enabled').click();

    cy.location('pathname').should('eq', '/register');
    cy.get('[data-cy=success]').should('contain', 'Serveur indisponible, veuillez r');
  });

  it('refuse le doublon email meme avec casse differente', () => {
    visitHomeWithData({ seed: false, users: [user] });
    goToRegister();

    fillForm({
      ...secondUser,
      email: '  JULIE.MARTIN@EXAMPLE.COM  ',
    });

    cy.contains(/Cet email est d.*j.* utilis/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });
});
