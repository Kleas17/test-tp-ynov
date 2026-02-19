describe('Navigation SPA inscription', () => {
  const user = {
    nom: 'Martin',
    prenom: 'Julie',
    email: 'julie.martin@example.com',
    dateNaissance: '1990-01-01',
    cp: '69001',
    ville: 'Lyon',
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
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
    cy.get('[data-cy=registered-user]').should('not.exist');

    cy.get('[data-cy=go-to-register]').click();
    cy.location('pathname').should('eq', '/register');

    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('Scenario erreur: avec 1 inscrit -> tentative invalide -> accueil inchange', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('registrations', JSON.stringify([user]));
      },
    });

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);

    cy.get('[data-cy=go-to-register]').click();
    cy.location('pathname').should('eq', '/register');

    fillForm({
      ...user,
      nom: 'Durand',
      prenom: 'Luc',
      cp: '75001',
    });

    cy.contains('Cet email est déjà utilisé').should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');

    cy.get('[data-cy=go-home]').click();
    cy.location('pathname').should('eq', '/');

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });
});
