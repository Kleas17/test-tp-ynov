describe('Docker live stack', () => {
  it('affiche les utilisateurs seeds exposes par l API', () => {
    cy.visit('/');

    cy.get('[data-cy=registered-count]')
      .should(($count) => {
        const text = $count.text();
        const match = text.match(/(\d+)/);

        expect(match, 'registered users count').to.not.be.null;
        expect(Number(match[1]), 'seeded users count').to.be.greaterThan(0);
      });

    cy.get('[data-cy=registered-user]').should('have.length.at.least', 1);
  });
});
