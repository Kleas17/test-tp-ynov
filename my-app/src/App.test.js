import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as validatorModule from './validator';

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
    localStorage.clear();
    jest.restoreAllMocks();
    window.history.pushState({}, '', '/');
});

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
    test('accueil initial: compteur a 0 et liste vide', () => {
        render(<App />);

        expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
        expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
    });

    test('hydrate la liste depuis le localStorage', () => {
        localStorage.setItem('registrations', JSON.stringify([userValide]));

        render(<App />);

        expect(screen.getByText('1 utilisateur(s) inscrit(s)')).toBeInTheDocument();
        expect(screen.getByText('Martin Julie')).toBeInTheDocument();
    });

    test('json invalide dans localStorage: fallback liste vide', () => {
        localStorage.setItem('registrations', '{broken');

        render(<App />);

        expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
        expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
    });

    test('format localStorage non tableau: fallback liste vide', () => {
        localStorage.setItem('registrations', JSON.stringify({ nom: 'NotArray' }));

        render(<App />);

        expect(screen.getByText('0 utilisateur(s) inscrit(s)')).toBeInTheDocument();
        expect(screen.getByText('Aucun utilisateur inscrit pour le moment.')).toBeInTheDocument();
    });

    test('navigation accueil vers formulaire puis retour accueil', async () => {
        render(<App />);

        await allerAuFormulaire();
        expect(window.location.pathname).toBe('/register');
        expect(screen.getByText('Formulaire utilisateur')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('link', { name: /retour à l'accueil/i }));
        expect(window.location.pathname).toBe('/');
        expect(screen.getByText('Bienvenue sur l\'application d\'inscription')).toBeInTheDocument();
    });

    test('prenom HTML invalide puis correction retire le message', async () => {
        render(<App />);
        await allerAuFormulaire();

        await userEvent.type(screen.getByLabelText(champs.prenom), '<b>');
        await userEvent.tab();
        expect(screen.getByText('Contenu HTML détecté')).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText(champs.prenom));
        await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
        expect(screen.queryByText('Contenu HTML détecté')).not.toBeInTheDocument();
    });

    test('email deja utilise: erreur visible et soumission bloquee', async () => {
        localStorage.setItem('registrations', JSON.stringify([{ ...userValide }]));
        render(<App />);
        await allerAuFormulaire();

        await userEvent.type(screen.getByLabelText(champs.nom), 'Durand');
        await userEvent.type(screen.getByLabelText(champs.prenom), 'Luc');
        await userEvent.type(screen.getByLabelText(champs.email), userValide.email);
        await userEvent.type(screen.getByLabelText(champs.dateNaissance), '1992-02-02');
        await userEvent.type(screen.getByLabelText(champs.cp), '75001');
        await userEvent.type(screen.getByLabelText(champs.ville), 'Paris');

        expect(screen.getByText('Cet email est déjà utilisé')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
    });

    test('soumission valide: redirection accueil, compteur et liste mis a jour', async () => {
        render(<App />);
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        await allerAuFormulaire();
        await remplirFormulaireValide();
        await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

        expect(window.location.pathname).toBe('/');
        expect(screen.getByText('1 utilisateur(s) inscrit(s)')).toBeInTheDocument();
        expect(screen.getByText('Martin Julie')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Inscription enregistrée');

        expect(setItemSpy).toHaveBeenCalledWith('registrations', JSON.stringify([userValide]));
        expect(setItemSpy).toHaveBeenCalledWith('registration', JSON.stringify(userValide));
        setItemSpy.mockRestore();
    });

    test('soumission forcee invalide ne sauvegarde rien', async () => {
        render(<App />);
        await allerAuFormulaire();
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        fireEvent.submit(screen.getByRole('button', { name: /soumettre/i }).closest('form'));
        expect(setItemSpy).not.toHaveBeenCalled();
        setItemSpy.mockRestore();
    });

    test('erreur technique de validation: fallback affiche', async () => {
        const identitySpy = jest
            .spyOn(validatorModule, 'validateIdentity')
            .mockImplementation(() => {
                throw new Error('unexpected');
            });

        render(<App />);
        await allerAuFormulaire();

        const nomInput = screen.getByLabelText(champs.nom);
        fireEvent.change(nomInput, { target: { value: 'Martin' } });
        fireEvent.blur(nomInput);

        expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
        identitySpy.mockRestore();
    });
});
