import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';

const RegisterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: #4ade80;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const ValidationHint = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
`;

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, error } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = () => {
    return (
      formData.username.length >= 3 &&
      formData.email.includes('@') &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setSuccess(false);
    
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    });
    
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      console.log('Registration successful');
    }
  };

  return (
    <RegisterForm onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Registration successful! Welcome to Epoch Battles!</SuccessMessage>}
      
      <FormGroup>
        <Label htmlFor="reg-username">Username</Label>
        <Input
          type="text"
          id="reg-username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a username"
          required
        />
        <ValidationHint>3-20 characters, letters, numbers, and underscores only</ValidationHint>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="reg-email">Email</Label>
        <Input
          type="email"
          id="reg-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          type="password"
          id="reg-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
        />
        <ValidationHint>At least 6 characters</ValidationHint>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          type="password"
          id="confirm-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <ValidationHint style={{ color: '#ff6b6b' }}>Passwords do not match</ValidationHint>
        )}
      </FormGroup>

      <Button type="submit" disabled={loading || !isFormValid()}>
        {loading ? 'Creating Account...' : 'Register'}
      </Button>
    </RegisterForm>
  );
}

export default Register;