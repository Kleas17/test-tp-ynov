import './App.css';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ValidationError, validateAge, validateEmail, validateIdentity, validatePostalCode, validateUniqueEmail } from './validator';
import { createRegistration, getRegistrations } from './api';
const initialValues = {
  nom: '',
  prenom: '',
  email: '',
  dateNaissance: '',
  cp: '',
  ville: ''
};
const fieldLabels = {
  nom: 'Nom',
  prenom: 'Prénom',
  email: 'Email',
  dateNaissance: 'Date de naissance',
  cp: 'Code postal',
  ville: 'Ville'
};

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
function HomePage({
  users,
  onStartRegistration
}) {
  return /*#__PURE__*/React.createElement("section", {
    "data-cy": "home-page"
  }, /*#__PURE__*/React.createElement("h1", null, "Bienvenue sur l'application d'inscription"), /*#__PURE__*/React.createElement("p", {
    "data-cy": "registered-count"
  }, users.length, " utilisateur(s) inscrit(s)"), users.length === 0 ? /*#__PURE__*/React.createElement("p", {
    "data-cy": "empty-list"
  }, "Aucun utilisateur inscrit pour le moment.") : /*#__PURE__*/React.createElement("ul", {
    "data-cy": "registered-list",
    className: "registered-list"
  }, users.map((user, index) => /*#__PURE__*/React.createElement("li", {
    key: `${user.email}-${index}`,
    "data-cy": "registered-user",
    className: "registered-item"
  }, user.nom, " ", user.prenom))), /*#__PURE__*/React.createElement(Link, {
    to: "/register",
    "data-cy": "go-to-register",
    className: "action-button primary-action link-button",
    onClick: onStartRegistration
  }, "Ajouter un utilisateur"));
}
function RegisterPage({
  users,
  onRegister
}) {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validateForm(values, users), [values, users]);
  const isValid = Object.keys(errors).length === 0;
  const onChange = event => {
    const {
      name,
      value
    } = event.target;
    setValues(previous => ({
      ...previous,
      [name]: value
    }));
  };
  const onBlur = event => {
    const {
      name
    } = event.target;
    setTouched(previous => ({
      ...previous,
      [name]: true
    }));
  };
  const onSubmit = async event => {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    const registrationSucceeded = await onRegister(values);
    if (!registrationSucceeded) {
      return;
    }
    setValues(initialValues);
    setTouched({});
    navigate('/');
  };
  const shouldShowError = fieldName => Boolean(touched[fieldName] || values[fieldName]);
  return /*#__PURE__*/React.createElement("section", {
    "data-cy": "register-page"
  }, /*#__PURE__*/React.createElement("h1", null, "Formulaire utilisateur"), /*#__PURE__*/React.createElement("form", {
    onSubmit: onSubmit,
    noValidate: true
  }, Object.keys(initialValues).map(fieldName => /*#__PURE__*/React.createElement("div", {
    key: fieldName,
    className: "field-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldName
  }, fieldLabels[fieldName]), /*#__PURE__*/React.createElement("input", {
    id: fieldName,
    name: fieldName,
    type: fieldName === 'dateNaissance' ? 'date' : 'text',
    value: values[fieldName],
    onChange: onChange,
    onBlur: onBlur,
    "aria-invalid": Boolean(errors[fieldName]),
    "aria-describedby": `${fieldName}-error`,
    "data-cy": fieldName
  }), shouldShowError(fieldName) && errors[fieldName] ? /*#__PURE__*/React.createElement("p", {
    id: `${fieldName}-error`,
    role: "alert",
    className: "error-text"
  }, errors[fieldName]) : null)), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !isValid,
    className: `submit-button ${!isValid ? 'disabled' : ''}`,
    "data-cy": "submit"
  }, "Soumettre"), /*#__PURE__*/React.createElement(Link, {
    to: "/",
    "data-cy": "go-home",
    className: "action-button secondary-action link-button"
  }, "Retour \xE0 l'accueil")));
}
function App() {
  const [users, setUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  useEffect(() => {
    let isMounted = true;
    const loadRegistrations = async () => {
      try {
        const loadedUsers = await getRegistrations();
        if (isMounted) {
          setUsers(loadedUsers);
        }
      } catch {
        if (isMounted) {
          setUsers([]);
        }
      }
    };
    loadRegistrations();
    return () => {
      isMounted = false;
    };
  }, []);
  const onRegister = async newUser => {
    try {
      await createRegistration(newUser);
      setUsers(previousUsers => [...previousUsers, newUser]);
      setToastMessage('Inscription enregistrée');
      return true;
    } catch (error) {
      const statusCode = error?.response?.status;
      const backendMessage = error?.response?.data?.message;
      if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500 && backendMessage) {
        setToastMessage(backendMessage);
        return false;
      }
      if (typeof statusCode === 'number' && statusCode >= 500) {
        setToastMessage('Serveur indisponible, veuillez réessayer plus tard.');
        return false;
      }
      setToastMessage("Erreur lors de l'inscription");
      return false;
    }
  };
  return /*#__PURE__*/React.createElement(BrowserRouter, {
    basename: process.env.PUBLIC_URL,
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "App"
  }, /*#__PURE__*/React.createElement("main", {
    className: "form-container"
  }, /*#__PURE__*/React.createElement(Routes, null, /*#__PURE__*/React.createElement(Route, {
    path: "/",
    element: /*#__PURE__*/React.createElement(HomePage, {
      users: users,
      onStartRegistration: () => setToastMessage('')
    })
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/register",
    element: /*#__PURE__*/React.createElement(RegisterPage, {
      users: users,
      onRegister: onRegister
    })
  }), /*#__PURE__*/React.createElement(Route, {
    path: "*",
    element: /*#__PURE__*/React.createElement(Navigate, {
      to: "/",
      replace: true
    })
  })), toastMessage ? /*#__PURE__*/React.createElement("div", {
    className: "toast",
    role: "status",
    "aria-live": "polite",
    "data-cy": "success"
  }, toastMessage) : null)));
}
export default App;