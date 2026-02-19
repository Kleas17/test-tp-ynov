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
    visitHomeWithStorage();

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
    cy.get('[data-cy=registered-user]').should('not.exist');

    goToRegister();
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

    goToRegister();

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

  it('bloque nom avec chiffres', () => {
    visitHomeWithStorage();
    goToRegister();

    cy.get('[data-cy=nom]').type('Martin123').blur();

    cy.contains(/Caractères invalides dans le nom|Caracteres invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque prenom avec chiffres', () => {
    visitHomeWithStorage();
    goToRegister();

    cy.get('[data-cy=prenom]').type('Julie9').blur();

    cy.contains(/Caractères invalides dans le nom|Caracteres invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque ville avec symbole', () => {
    visitHomeWithStorage();
    goToRegister();

    cy.get('[data-cy=ville]').type('Paris!').blur();

    cy.contains(/Caractères invalides dans le nom|Caracteres invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque email farfelu (accent + parenthese)', () => {
    visitHomeWithStorage();
    goToRegister();

    cy.get('[data-cy=email]').type('kleas3.marc@gmaà)l.com').blur();

    cy.contains("Format d'email invalide").should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque date farfelue trop ancienne', () => {
    visitHomeWithStorage();
    goToRegister();

    fillForm({
      ...user,
      email: 'julie.farfelue@example.com',
      dateNaissance: '1900-01-01',
    });

    cy.contains('Date de naissance invalide').should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque code postal invalide', () => {
    visitHomeWithStorage();
    goToRegister();

    cy.get('[data-cy=cp]').type('75A').blur();

    cy.contains(/Code postal francais invalide|Code postal français invalide/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
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

    goToRegister();
    fillForm(secondUser);
    cy.get('[data-cy=submit]').click();

    cy.get('[data-cy=registered-count]').should('contain', '2 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 2);
    cy.get('[data-cy=registered-user]').eq(0).should('contain', 'Martin Julie');
    cy.get('[data-cy=registered-user]').eq(1).should('contain', 'Durand Luc');
  });

  it('refuse le doublon email meme avec casse differente', () => {
    visitHomeWithStorage([user]);

    goToRegister();
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
