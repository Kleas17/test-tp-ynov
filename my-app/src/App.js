import './App.css';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
    ValidationError,
    validateAge,
    validateEmail,
    validateIdentity,
    validatePostalCode,
    validateUniqueEmail,
} from './validator';

const REGISTRATION_KEY = 'registration';
const REGISTRATIONS_KEY = 'registrations';

const initialValues = {
    nom: '',
    prenom: '',
    email: '',
    dateNaissance: '',
    cp: '',
    ville: '',
};

const fieldLabels = {
    nom: 'Nom',
    prenom: 'Prénom',
    email: 'Email',
    dateNaissance: 'Date de naissance',
    cp: 'Code postal',
    ville: 'Ville',
};

function readRegistrations() {
    try {
        const rawRegistrations = localStorage.getItem(REGISTRATIONS_KEY);
        if (!rawRegistrations) {
            return [];
        }

        const parsedRegistrations = JSON.parse(rawRegistrations);
        return Array.isArray(parsedRegistrations) ? parsedRegistrations : [];
    } catch {
        return [];
    }
}

function persistRegistrations(users) {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(users));
    localStorage.setItem(REGISTRATION_KEY, JSON.stringify(users[users.length - 1]));
}

/**
 * Runs all form validations and returns an object keyed by field name.
 * @param {{nom:string, prenom:string, email:string, dateNaissance:string, cp:string, ville:string}} values
 * @param {Array<{email:string}>} users
 * @returns {Record<string, string>} Field-level validation errors.
 */
function validateForm(values, users) {
    const nextErrors = {};

    const runValidation = (field, validator) => {
        try {
            validator();
        } catch (error) {
            if (error instanceof ValidationError) {
                nextErrors[field] = error.message;
                return;
            }
            nextErrors[field] = 'Erreur de validation';
        }
    };

    runValidation('nom', () => validateIdentity(values.nom.trim()));
    runValidation('prenom', () => validateIdentity(values.prenom.trim()));
    runValidation('ville', () => validateIdentity(values.ville.trim()));
    runValidation('email', () => validateEmail(values.email.trim()));

    if (!nextErrors.email) {
        runValidation('email', () => validateUniqueEmail(values.email, users));
    }

    runValidation('cp', () => validatePostalCode(values.cp.trim()));
    runValidation('dateNaissance', () => validateAge(new Date(values.dateNaissance)));

    return nextErrors;
}

function HomePage({ users, toastMessage, onStartRegistration }) {
    return (
        <section data-cy="home-page">
            <h1>Bienvenue sur l'application d'inscription</h1>
            <p data-cy="registered-count">{users.length} utilisateur(s) inscrit(s)</p>

            {users.length === 0 ? (
                <p data-cy="empty-list">Aucun utilisateur inscrit pour le moment.</p>
            ) : (
                <ul data-cy="registered-list" className="registered-list">
                    {users.map((user, index) => (
                        <li key={`${user.email}-${index}`} data-cy="registered-user" className="registered-item">
                            {user.nom} {user.prenom}
                        </li>
                    ))}
                </ul>
            )}

            <Link
                to="/register"
                data-cy="go-to-register"
                className="action-button primary-action link-button"
                onClick={onStartRegistration}
            >
                Ajouter un utilisateur
            </Link>

            {toastMessage ? (
                <div className="toast" role="status" aria-live="polite" data-cy="success">
                    {toastMessage}
                </div>
            ) : null}
        </section>
    );
}

function RegisterPage({ users, onRegister }) {
    const navigate = useNavigate();
    const [values, setValues] = useState(initialValues);
    const [touched, setTouched] = useState({});

    const errors = useMemo(() => validateForm(values, users), [values, users]);
    const isValid = Object.keys(errors).length === 0;

    const onChange = (event) => {
        const { name, value } = event.target;
        setValues((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const onBlur = (event) => {
        const { name } = event.target;
        setTouched((previous) => ({
            ...previous,
            [name]: true,
        }));
    };

    const onSubmit = (event) => {
        event.preventDefault();
        if (!isValid) {
            return;
        }

        onRegister(values);
        setValues(initialValues);
        setTouched({});
        navigate('/');
    };

    const shouldShowError = (fieldName) => Boolean(touched[fieldName] || values[fieldName]);

    return (
        <section data-cy="register-page">
            <h1>Formulaire utilisateur</h1>
            <form onSubmit={onSubmit} noValidate>
                {Object.keys(initialValues).map((fieldName) => (
                    <div key={fieldName} className="field-group">
                        <label htmlFor={fieldName}>{fieldLabels[fieldName]}</label>
                        <input
                            id={fieldName}
                            name={fieldName}
                            type={fieldName === 'dateNaissance' ? 'date' : 'text'}
                            value={values[fieldName]}
                            onChange={onChange}
                            onBlur={onBlur}
                            aria-invalid={Boolean(errors[fieldName])}
                            aria-describedby={`${fieldName}-error`}
                            data-cy={fieldName}
                        />
                        {shouldShowError(fieldName) && errors[fieldName] ? (
                            <p id={`${fieldName}-error`} role="alert" className="error-text">
                                {errors[fieldName]}
                            </p>
                        ) : null}
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={!isValid}
                    className={`submit-button ${!isValid ? 'disabled' : ''}`}
                    data-cy="submit"
                >
                    Soumettre
                </button>

                <Link to="/" data-cy="go-home" className="action-button secondary-action link-button">
                    Retour à l'accueil
                </Link>
            </form>
        </section>
    );
}

function App() {
    const [users, setUsers] = useState(() => readRegistrations());
    const [toastMessage, setToastMessage] = useState('');

    const onRegister = (newUser) => {
        const nextUsers = [...users, newUser];
        setUsers(nextUsers);
        persistRegistrations(nextUsers);
        setToastMessage('Inscription enregistrée');
    };

    return (
        <BrowserRouter
            basename={process.env.PUBLIC_URL}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
            <div className="App">
                <main className="form-container">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <HomePage
                                    users={users}
                                    toastMessage={toastMessage}
                                    onStartRegistration={() => setToastMessage('')}
                                />
                            }
                        />
                        <Route
                            path="/register"
                            element={<RegisterPage users={users} onRegister={onRegister} />}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
