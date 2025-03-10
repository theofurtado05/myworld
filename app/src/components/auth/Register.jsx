import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

const Register = ({ setShowLogin, setCurrentUser, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      setLoading(false);
      // Close the modal after successful registration
      if (onClose) onClose();
    } catch (error) {
      setError('Erro ao registrar: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Registrar</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleRegister} className='flex flex-col gap-4'>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-4 border rounded-lg h-[30px]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-[30px]"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 h-[30px]"
        >
          {loading ? 'Carregando...' : 'Registrar'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Já tem uma conta?{' '}
        <button
          onClick={() => setShowLogin(true)}
          className="text-blue-500 hover:underline"
        >
          Faça login
        </button>
      </p>
    </div>
  );
};

export default Register;