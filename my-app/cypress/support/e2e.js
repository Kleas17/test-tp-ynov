const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8000';

Cypress.Commands.add('resetTestData', (payload = {}) =>
  cy.request('POST', `${apiUrl}/test/reset`, payload)
);

Cypress.Commands.add('queueCreateUserFault', (statusCode = 500) =>
  cy.request('POST', `${apiUrl}/test/faults/next-create-user`, { statusCode })
);
