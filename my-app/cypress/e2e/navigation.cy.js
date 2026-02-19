describe('Navigation SPA inscription', () => {
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

  const visitHomeWithStorage = (registrationsSetup) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        if (registrationsSetup !== undefined) {
          if (typeof registrationsSetup === 'string') {
            win.localStorage.setItem('registrations', registrationsSetup);
          } else {
            win.localStorage.setItem('registrations', JSON.stringify(registrationsSetup));
          }
        }
      },
    });
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
    visitHomeWithStorage();

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
    visitHomeWithStorage([user]);

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

    cy.contains(/Cet email est deja utilise|Cet email est déjà utilisé/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');

    cy.get('[data-cy=go-home]').click();
    cy.location('pathname').should('eq', '/');

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('persiste bien au rechargement navigateur', () => {
    visitHomeWithStorage([user]);

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.reload();
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('accepte plusieurs inscriptions et conserve la liste complete', () => {
    visitHomeWithStorage([user]);

    cy.get('[data-cy=go-to-register]').click();
    fillForm(secondUser);
    cy.get('[data-cy=submit]').click();

    cy.get('[data-cy=registered-count]').should('contain', '2 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 2);
    cy.get('[data-cy=registered-user]').eq(0).should('contain', 'Martin Julie');
    cy.get('[data-cy=registered-user]').eq(1).should('contain', 'Durand Luc');
  });

  it('bloque les saisies farfelues: XSS + mineur + CP invalide', () => {
    visitHomeWithStorage();

    cy.get('[data-cy=go-to-register]').click();

    fillForm({
      nom: 'Martin',
      prenom: '<b>',
      email: 'valid@example.com',
      dateNaissance: '2015-01-01',
      cp: '75A',
      ville: 'Paris',
    });

    cy.contains(/Contenu HTML detecte|Contenu HTML détecté/i).should('be.visible');
    cy.contains(/Code postal francais invalide|Code postal français invalide/i).should('be.visible');
    cy.contains("L'utilisateur doit avoir au moins 18 ans").should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('refuse le doublon email meme avec casse differente', () => {
    visitHomeWithStorage([user]);

    cy.get('[data-cy=go-to-register]').click();
    fillForm({
      ...secondUser,
      email: '  JULIE.MARTIN@EXAMPLE.COM  ',
    });

    cy.contains(/Cet email est deja utilise|Cet email est déjà utilisé/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('retombe en etat sain si localStorage est corrompu', () => {
    visitHomeWithStorage('{broken-json');

    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
    cy.get('[data-cy=registered-user]').should('not.exist');
  });

  it('retombe en etat sain si registrations nest pas un tableau', () => {
    visitHomeWithStorage({ weird: true });

    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
  });
});