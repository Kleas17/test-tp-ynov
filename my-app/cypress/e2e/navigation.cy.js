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

  const visitHomeWithApi = (users = [], statusCode = 200) => {
    cy.intercept('GET', '**/users', {
      statusCode,
      body: users,
    }).as('getUsers');

    cy.visit('/');
    cy.wait('@getUsers');
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
    visitHomeWithApi([]);

    cy.intercept('POST', '**/users', {
      statusCode: 201,
      body: { id: 101, ...user },
    }).as('createUser');

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
    cy.get('[data-cy=registered-user]').should('not.exist');

    goToRegister();
    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();
    cy.wait('@createUser');

    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('Scenario erreur: avec 1 inscrit -> tentative invalide -> accueil inchange', () => {
    visitHomeWithApi([user]);

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);

    goToRegister();

    fillForm({
      ...user,
      nom: 'Durand',
      prenom: 'Luc',
      cp: '75001',
    });

    cy.contains(/Cet email est déjà utilisé/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');

    cy.get('[data-cy=go-home]').click();
    cy.location('pathname').should('eq', '/');

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 1);
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('bloque nom avec chiffres', () => {
    visitHomeWithApi([]);
    goToRegister();

    cy.get('[data-cy=nom]').type('Martin123').blur();

    cy.contains(/Caractères invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque prenom avec chiffres', () => {
    visitHomeWithApi([]);
    goToRegister();

    cy.get('[data-cy=prenom]').type('Julie9').blur();

    cy.contains(/Caractères invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque ville avec symbole', () => {
    visitHomeWithApi([]);
    goToRegister();

    cy.get('[data-cy=ville]').type('Paris!').blur();

    cy.contains(/Caractères invalides dans le nom/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque email farfelu (accent + parenthese)', () => {
    visitHomeWithApi([]);
    goToRegister();

    cy.get('[data-cy=email]').type('kleas3.marc@gma)l.com').blur();

    cy.contains("Format d'email invalide").should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('bloque date farfelue trop ancienne', () => {
    visitHomeWithApi([]);
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
    visitHomeWithApi([]);
    goToRegister();

    cy.get('[data-cy=cp]').type('75A').blur();

    cy.contains(/Code postal français invalide/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('persiste bien au rechargement navigateur via API mockee', () => {
    visitHomeWithApi([user]);

    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.reload();
    cy.wait('@getUsers');
    cy.get('[data-cy=registered-count]').should('contain', '1 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').first().should('contain', 'Martin Julie');
  });

  it('accepte plusieurs inscriptions et conserve la liste complete', () => {
    visitHomeWithApi([user]);

    cy.intercept('POST', '**/users', {
      statusCode: 201,
      body: { id: 102, ...secondUser },
    }).as('createUser');

    goToRegister();
    fillForm(secondUser);
    cy.get('[data-cy=submit]').click();
    cy.wait('@createUser');

    cy.get('[data-cy=registered-count]').should('contain', '2 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=registered-user]').should('have.length', 2);
    cy.get('[data-cy=registered-user]').eq(0).should('contain', 'Martin Julie');
    cy.get('[data-cy=registered-user]').eq(1).should('contain', 'Durand Luc');
  });

  it('refuse le doublon email meme avec casse differente', () => {
    visitHomeWithApi([user]);

    goToRegister();
    fillForm({
      ...secondUser,
      email: '  JULIE.MARTIN@EXAMPLE.COM  ',
    });

    cy.contains(/Cet email est déjà utilisé/i).should('be.visible');
    cy.get('[data-cy=submit]').should('be.disabled');
  });

  it('retombe en etat sain si API indisponible', () => {
    visitHomeWithApi({ message: 'error' }, 500);

    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
    cy.get('[data-cy=registered-user]').should('not.exist');
  });

  it('retombe en etat sain si payload users est invalide', () => {
    visitHomeWithApi({ weird: true });

    cy.get('[data-cy=registered-count]').should('contain', '0 utilisateur(s) inscrit(s)');
    cy.get('[data-cy=empty-list]').should('be.visible');
  });

  it('affiche le message metier backend sur erreur 400', () => {
    visitHomeWithApi([]);

    cy.intercept('POST', '**/users', {
      statusCode: 400,
      body: { message: 'Cet email est déjà utilisé (back)' },
    }).as('createUser400');

    goToRegister();
    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();
    cy.wait('@createUser400');

    cy.location('pathname').should('eq', '/register');
    cy.get('[data-cy=success]').should('contain', 'Cet email est déjà utilisé (back)');
  });

  it('affiche une alerte utilisateur sur erreur serveur 500', () => {
    visitHomeWithApi([]);

    cy.intercept('POST', '**/users', {
      statusCode: 500,
      body: { message: 'Server error' },
    }).as('createUser500');

    goToRegister();
    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();
    cy.wait('@createUser500');

    cy.location('pathname').should('eq', '/register');
    cy.get('[data-cy=success]').should('contain', 'Serveur indisponible, veuillez réessayer plus tard.');
  });

  it('affiche le message metier backend sur erreur 409', () => {
    visitHomeWithApi([]);

    cy.intercept('POST', '**/users', {
      statusCode: 409,
      body: { message: 'Conflit: email déjà existant (409)' },
    }).as('createUser409');

    goToRegister();
    fillForm(user);
    cy.get('[data-cy=submit]').should('be.enabled').click();
    cy.wait('@createUser409');

    cy.location('pathname').should('eq', '/register');
    cy.get('[data-cy=success]').should('contain', 'Conflit: email déjà existant (409)');
  });
});

