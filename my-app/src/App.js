import './App.css';
import { useMemo, useState } from 'react';
import {
    ValidationError,
    validateAge,
    validateEmail,
    validateIdentity,
    validatePostalCode,
} from './validator';

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
    prenom: 'Prenom',
    email: 'Email',
    dateNaissance: 'Date de naissance',
    cp: 'Code postal',
    ville: 'Ville',
};

/**
 * Runs all form validations and returns an object keyed by field name.
 * @param {{nom:string, prenom:string, email:string, dateNaissance:string, cp:string, ville:string}} values
 * @returns {Record<string, string>} Field-level validation errors.
 */
function validateForm(values) {
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
    runValidation('cp', () => validatePostalCode(values.cp.trim()));
    runValidation('dateNaissance', () => validateAge(new Date(values.dateNaissance)));

    return nextErrors;
}

/**
 * Registration form page with client-side validations.
 * @returns {JSX.Element}
 */
function App() {
    const [values, setValues] = useState(initialValues);
    const [touched, setTouched] = useState({});
    const [toastMessage, setToastMessage] = useState('');

    const errors = useMemo(() => validateForm(values), [values]);
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

        localStorage.setItem('registration', JSON.stringify(values));
        setToastMessage('Inscription enregistree');
        setValues(initialValues);
        setTouched({});
    };

    const shouldShowError = (fieldName) => Boolean(touched[fieldName] || values[fieldName]);

    return (
        <div className="App">
            <main className="form-container">
                <h1>Formulaire utilisateur</h1>
                <p className="readme-link">
                    <a href={`${process.env.PUBLIC_URL}/README.md`} target="_blank" rel="noreferrer">
                        Consulter le README du projet
                    </a>
                </p>
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
                    >
                        Soumettre
                    </button>
                </form>
                {toastMessage ? (
                    <div className="toast" role="status" aria-live="polite">
                        {toastMessage}
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default App;
