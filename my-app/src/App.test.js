import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as validatorModule from './validator';

const champs = {
    nom: /^Nom$/i,
    prenom: /^Prenom$/i,
    email: /email/i,
    dateNaissance: /date de naissance/i,
    cp: /code postal/i,
    ville: /ville/i,
};

async function remplirFormulaireValide() {
    await userEvent.type(screen.getByLabelText(champs.nom), 'Martin');
    await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
    await userEvent.type(screen.getByLabelText(champs.email), 'julie.martin@example.com');
    await userEvent.type(screen.getByLabelText(champs.dateNaissance), '1990-01-01');
    await userEvent.type(screen.getByLabelText(champs.cp), '69001');
    await userEvent.type(screen.getByLabelText(champs.ville), 'Lyon');
}

describe('Interface formulaire - userEvent', () => {
    test('etat initial: bouton desactive et pas de toaster', () => {
        render(<App />);

        expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('prenom HTML invalide puis correction retire le message', async () => {
        render(<App />);

        await userEvent.type(screen.getByLabelText(champs.prenom), '<b>');
        await userEvent.tab();
        expect(screen.getByText('Contenu HTML detecte')).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText(champs.prenom));
        await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
        expect(screen.queryByText('Contenu HTML detecte')).not.toBeInTheDocument();
    });

    test('email invalide affiche un message puis disparait apres correction', async () => {
        render(<App />);

        await userEvent.type(screen.getByLabelText(champs.email), 'bad-mail');
        expect(screen.getByText("Format d'email invalide")).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText(champs.email));
        await userEvent.type(screen.getByLabelText(champs.email), 'ok@example.com');
        expect(screen.queryByText("Format d'email invalide")).not.toBeInTheDocument();
    });

    test('code postal invalide maintient le bouton desactive', async () => {
        render(<App />);

        await userEvent.type(screen.getByLabelText(champs.nom), 'Martin');
        await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
        await userEvent.type(screen.getByLabelText(champs.email), 'julie.martin@example.com');
        await userEvent.type(screen.getByLabelText(champs.dateNaissance), '1990-01-01');
        await userEvent.type(screen.getByLabelText(champs.cp), '750');
        await userEvent.type(screen.getByLabelText(champs.ville), 'Paris');

        expect(screen.getByText('Code postal francais invalide')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
    });

    test('date mineure affiche une erreur metier', async () => {
        render(<App />);

        await userEvent.type(screen.getByLabelText(champs.nom), 'Martin');
        await userEvent.type(screen.getByLabelText(champs.prenom), 'Julie');
        await userEvent.type(screen.getByLabelText(champs.email), 'julie.martin@example.com');
        await userEvent.type(screen.getByLabelText(champs.cp), '31000');
        await userEvent.type(screen.getByLabelText(champs.ville), 'Toulouse');
        await userEvent.type(screen.getByLabelText(champs.dateNaissance), '2012-05-14');

        expect(screen.getByText("L'utilisateur doit avoir au moins 18 ans")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /soumettre/i })).toBeDisabled();
    });

    test('formulaire valide active le bouton', async () => {
        render(<App />);

        await remplirFormulaireValide();
        expect(screen.getByRole('button', { name: /soumettre/i })).toBeEnabled();
    });

    test('soumission valide: localStorage appele, toaster affiche et formulaire vide', async () => {
        render(<App />);
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        await remplirFormulaireValide();
        await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

        expect(setItemSpy).toHaveBeenCalledTimes(1);
        expect(setItemSpy.mock.calls[0][0]).toBe('registration');
        expect(JSON.parse(setItemSpy.mock.calls[0][1])).toEqual({
            nom: 'Martin',
            prenom: 'Julie',
            email: 'julie.martin@example.com',
            dateNaissance: '1990-01-01',
            cp: '69001',
            ville: 'Lyon',
        });

        expect(screen.getByRole('status')).toHaveTextContent('Inscription enregistree');
        expect(screen.getByLabelText(champs.nom)).toHaveValue('');
        expect(screen.getByLabelText(champs.prenom)).toHaveValue('');
        expect(screen.getByLabelText(champs.email)).toHaveValue('');
        expect(screen.getByLabelText(champs.dateNaissance)).toHaveValue('');
        expect(screen.getByLabelText(champs.cp)).toHaveValue('');
        expect(screen.getByLabelText(champs.ville)).toHaveValue('');
        setItemSpy.mockRestore();
    });
});

describe('Contexte fireEvent - cas techniques cibles', () => {
    test('nom avec chiffres affiche une erreur', () => {
        render(<App />);
        const nomInput = screen.getByLabelText(champs.nom);

        fireEvent.change(nomInput, { target: { value: 'Martin123' } });
        fireEvent.blur(nomInput);

        expect(screen.getByText('Caracteres invalides dans le nom')).toBeInTheDocument();
        expect(nomInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('nom avec symbole affiche une erreur', () => {
        render(<App />);
        const nomInput = screen.getByLabelText(champs.nom);

        fireEvent.change(nomInput, { target: { value: 'Martin!' } });
        fireEvent.blur(nomInput);

        expect(screen.getByText('Caracteres invalides dans le nom')).toBeInTheDocument();
    });

    test('nom invalide puis corrige retire le message', () => {
        render(<App />);
        const nomInput = screen.getByLabelText(champs.nom);

        fireEvent.change(nomInput, { target: { value: 'Martin9' } });
        expect(screen.getByText('Caracteres invalides dans le nom')).toBeInTheDocument();

        fireEvent.change(nomInput, { target: { value: 'Martin' } });
        expect(screen.queryByText('Caracteres invalides dans le nom')).not.toBeInTheDocument();
        expect(nomInput).toHaveAttribute('aria-invalid', 'false');
    });

    test('soumission forcee invalide ne sauvegarde rien', () => {
        render(<App />);
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        fireEvent.submit(screen.getByRole('button', { name: /soumettre/i }).closest('form'));
        expect(setItemSpy).not.toHaveBeenCalled();
        setItemSpy.mockRestore();
    });

    test('erreur technique de validation: fallback francais affiche', () => {
        const identitySpy = jest
            .spyOn(validatorModule, 'validateIdentity')
            .mockImplementation(() => {
                throw new Error('unexpected');
            });

        render(<App />);
        const nomInput = screen.getByLabelText(champs.nom);

        fireEvent.change(nomInput, { target: { value: 'Martin' } });
        fireEvent.blur(nomInput);

        expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
        identitySpy.mockRestore();
    });
});
