import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as apiModule from './api';
import * as validatorModule from './validator';

jest.mock('./api');

const champs = {
  nom: /^Nom$/i,
  prenom: /^Prénom$/i,
  email: /email/i,
  dateNaissance: /date de naissance/i,
  cp: /code postal/i,
  ville: /ville/i,
};

const userValide = {
  nom: 'Martin',
  prenom: 'Julie',
  email: 'julie.martin@example.com',
  dateNaissance: '1990-01-01',
  cp: '69001',
  ville: 'Lyon',
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
  apiModule.getRegistrations.mockResolvedValue([]);
  apiModule.createRegistration.mockResolvedValue({ id: 1 });
});

async function renderApp() {
  render(<App />);
  await waitFor(() => expect(apiModule.getRegistrations).toHaveBeenCalled());
}

async function allerAuFormulaire() {
  await userEvent.click(screen.getByRole('link', { name: /ajouter un utilisateur/i }));
}

async function remplirFormulaireValide() {
  await userEvent.type(screen.getByLabelText(champs.nom), userValide.nom);
  await userEvent.type(screen.getByLabelText(champs.prenom), userValide.prenom);
  await userEvent.type(screen.getByLabelText(champs.email), userValide.email);
  await userEvent.type(screen.getByLabelText(champs.dateNaissance), userValide.dateNaissance);
  await userEvent.type(screen.getByLabelText(champs.cp), userValide.cp);
  await userEvent.type(screen.getByLabelText(champs.ville), userValide.ville);
}

describe('Navigation SPA et formulaire - integration', () => {
  test('accueil initial: compteur a 0 et liste vide', async () => {
    await renderApp();

    expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
    expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
  });

  test('hydrate la liste depuis l API', async () => {
    apiModule.getRegistrations.mockResolvedValueOnce([userValide]);

    await renderApp();

    expect(await screen.findByText('1 utilisateur(s) inscrit(s)')).toBeInTheDocument();
    expect(screen.getByText('Martin Julie')).toBeInTheDocument();
  });

  test('erreur API au chargement: fallback liste vide', async () => {
    apiModule.getRegistrations.mockRejectedValueOnce(new Error('Network Error'));

    await renderApp();

    expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
    expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
  });

  test('navigation accueil vers formulaire puis retour accueil', async () => {
    await renderApp();

    await allerAuFormulaire();
    expect(window.location.pathname).toBe('/register');
    expect(screen.getByText('Formulaire utilisateur')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /retour à l'accueil/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByText("Bienvenue sur l'application d'inscription")).toBeInTheDocument();
  });

  test('prenom avec chiffres: erreur et blocage submit', async () => {
    await renderApp();
    await allerAuFormulaire();

    await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie9');

    expect(screen.getByText(/Caractères invalides dans le nom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
  });

  test('ville avec symbole: erreur et blocage submit', async () => {
    await renderApp();
    await allerAuFormulaire();

    await userEvent.type(screen.getByLabelText(champs.ville), 'Paris!');

    expect(screen.getByText(/Caractères invalides dans le nom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
  });

  test('email farfelu (accent/parenthese): erreur visible', async () => {
    await renderApp();
    await allerAuFormulaire();

    await userEvent.type(screen.getByLabelText(champs.email), 'kleas3.marc@gma)l.com');

    expect(screen.getByText("Format d'email invalide")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
  });

  test('date farfelue (0008): erreur visible', async () => {
    await renderApp();
    await allerAuFormulaire();

    await userEvent.type(screen.getByLabelText(champs.nom), 'Martin');
    await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
    await userEvent.type(screen.getByLabelText(champs.email), 'julie.martin2@example.com');
    await userEvent.type(screen.getByLabelText(champs.cp), '69001');
    await userEvent.type(screen.getByLabelText(champs.ville), 'Lyon');
    await userEvent.type(screen.getByLabelText(champs.dateNaissance), '0008-08-08');

    expect(screen.getByText('Date de naissance invalide')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
  });

  test('email deja utilise: erreur visible et soumission bloquee', async () => {
    apiModule.getRegistrations.mockResolvedValueOnce([{ ...userValide }]);
    await renderApp();
    await screen.findByText('1 utilisateur(s) inscrit(s)');
    await allerAuFormulaire();

    await userEvent.type(screen.getByLabelText(champs.nom), 'Durand');
    await userEvent.type(screen.getByLabelText(champs.prenom), 'Luc');
    await userEvent.type(screen.getByLabelText(champs.email), userValide.email);
    await userEvent.type(screen.getByLabelText(champs.dateNaissance), '1992-02-02');
    await userEvent.type(screen.getByLabelText(champs.cp), '75001');
    await userEvent.type(screen.getByLabelText(champs.ville), 'Paris');

    expect(screen.getByText(/Cet email est .*utilis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
  });

  test('soumission valide: redirection accueil, compteur et liste mis a jour', async () => {
    await renderApp();

    await allerAuFormulaire();
    await remplirFormulaireValide();
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(await screen.findByText('1 utilisateur(s) inscrit(s)')).toBeInTheDocument();
    expect(screen.getByText('Martin Julie')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Inscription enregistrée');

    expect(apiModule.createRegistration).toHaveBeenCalledWith(userValide);
  });

  test('soumission invalide ne declenche pas appel API', async () => {
    await renderApp();
    await allerAuFormulaire();

    fireEvent.submit(screen.getByRole('button', { name: /soumettre/i }).closest('form'));
    expect(apiModule.createRegistration).not.toHaveBeenCalled();
  });

  test('echec API a la soumission: reste sur formulaire et affiche erreur', async () => {
    apiModule.createRegistration.mockRejectedValueOnce(new Error('Network Error'));
    await renderApp();

    await allerAuFormulaire();
    await remplirFormulaireValide();
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/register'));
    expect(await screen.findByRole('status')).toHaveTextContent("Erreur lors de l'inscription");
  });

  test('erreur metier backend 400: affiche le message du serveur', async () => {
    apiModule.createRegistration.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Cet email est déjà utilisé (back)' },
      },
    });

    await renderApp();
    await allerAuFormulaire();
    await remplirFormulaireValide();
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/register'));
    expect(await screen.findByRole('status')).toHaveTextContent('Cet email est déjà utilisé (back)');
  });

  test('erreur metier backend 409: affiche le message du serveur', async () => {
    apiModule.createRegistration.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'Conflit: email déjà existant (409)' },
      },
    });

    await renderApp();
    await allerAuFormulaire();
    await remplirFormulaireValide();
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/register'));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Conflit: email déjà existant (409)'
    );
  });

  test('erreur serveur 500: affiche une alerte utilisateur resilient', async () => {
    apiModule.createRegistration.mockRejectedValueOnce({
      response: {
        status: 500,
      },
    });

    await renderApp();
    await allerAuFormulaire();
    await remplirFormulaireValide();
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/register'));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Serveur indisponible, veuillez réessayer plus tard.'
    );
  });

  test('erreur technique de validation: fallback affiche', async () => {
    const identitySpy = jest.spyOn(validatorModule, 'validateIdentity').mockImplementation(() => {
      throw new Error('unexpected');
    });

    await renderApp();
    await allerAuFormulaire();

    const nomInput = screen.getByLabelText(champs.nom);
    fireEvent.change(nomInput, { target: { value: 'Martin' } });
    fireEvent.blur(nomInput);

    expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
    identitySpy.mockRestore();
  });

  test('snapshot de la page accueil', async () => {
    const { asFragment } = render(<App />);
    await waitFor(() => expect(apiModule.getRegistrations).toHaveBeenCalled());
    expect(asFragment()).toMatchSnapshot();
  });

  test('ne met pas a jour le state apres unmount pendant le chargement initial', async () => {
    let resolveRequest;
    const pendingRequest = new Promise((resolve) => {
      resolveRequest = resolve;
    });

    apiModule.getRegistrations.mockReturnValueOnce(pendingRequest);
    const { unmount } = render(<App />);

    expect(apiModule.getRegistrations).toHaveBeenCalledTimes(1);
    unmount();

    resolveRequest([userValide]);
    await waitFor(() => expect(apiModule.getRegistrations).toHaveBeenCalledTimes(1));
  });

  test('garde un etat sain si le chargement initial echoue apres attente', async () => {
    let rejectRequest;
    const pendingRequest = new Promise((_, reject) => {
      rejectRequest = reject;
    });

    apiModule.getRegistrations.mockReturnValueOnce(pendingRequest);
    render(<App />);

    expect(apiModule.getRegistrations).toHaveBeenCalledTimes(1);
    rejectRequest(new Error('Network Error'));

    await waitFor(() => {
      expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
      expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
    });
  });
});

