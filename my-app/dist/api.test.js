import axios from 'axios';
import { countUsers, createRegistration, getRegistrations } from './api';
jest.mock('axios');
describe('api integration with axios mock', () => {
  beforeEach(() => {
    process.env.REACT_APP_SERVER_PORT = '3000';
    delete process.env.REACT_APP_API_TOKEN;
    jest.clearAllMocks();
  });
  test('getRegistrations: succes avec payload utilisateurs', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({
      data: {
        utilisateurs: [{
          nom: 'Martin',
          prenom: 'Julie',
          email: 'julie.martin@example.com',
          dateNaissance: '1990-01-01',
          cp: '69001',
          ville: 'Lyon'
        }]
      }
    }));
    const users = await getRegistrations();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/users', {});
    expect(users).toEqual([{
      nom: 'Martin',
      prenom: 'Julie',
      email: 'julie.martin@example.com',
      dateNaissance: '1990-01-01',
      cp: '69001',
      ville: 'Lyon'
    }]);
  });
  test('getRegistrations: erreur reseau', async () => {
    axios.get.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));
    await expect(getRegistrations()).rejects.toThrow('Network Error');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/users', {});
  });
  test('getRegistrations: payload invalide retourne tableau vide', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({
      data: {
        unexpected: true
      }
    }));
    const users = await getRegistrations();
    expect(users).toEqual([]);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/users', {});
  });
  test('countUsers: succes avec tableau', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({
      data: [{
        id: 1,
        email: 'a@example.com'
      }, {
        id: 2,
        email: 'b@example.com'
      }]
    }));
    const result = await countUsers();
    expect(result).toEqual(2);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/users', {});
  });
  test('countUsers: erreur reseau', async () => {
    axios.get.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));
    await expect(countUsers()).rejects.toThrow('Network Error');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
  test('createRegistration: succes', async () => {
    const payload = {
      nom: 'Durand',
      prenom: 'Luc',
      email: 'luc.durand@example.com',
      dateNaissance: '1989-03-03',
      cp: '75001',
      ville: 'Paris'
    };
    axios.post.mockImplementationOnce(() => Promise.resolve({
      data: {
        id: 101,
        ...payload
      }
    }));
    const created = await createRegistration(payload);
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/users', payload, {});
    expect(created).toEqual({
      id: 101,
      ...payload
    });
  });
  test('createRegistration: erreur reseau', async () => {
    axios.post.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));
    await expect(createRegistration({
      email: 'ko@example.com'
    })).rejects.toThrow('Network Error');
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
  test('ajoute le header Authorization si REACT_APP_API_TOKEN est defini', async () => {
    process.env.REACT_APP_API_TOKEN = 'test-token';
    axios.get.mockResolvedValueOnce({
      data: []
    });
    await getRegistrations();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/users', {
      headers: {
        Authorization: 'Bearer test-token'
      }
    });
  });
});