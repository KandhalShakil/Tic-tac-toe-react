import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    identifier: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const { login, register, loading, error, clearError } = useAuth();

  // Generate a random OTP
  const generateOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    return newOtp;
  };

  // Send OTP via EmailJS using fetch API
  const sendOtp = async (email) => {
    setOtpLoading(true);
    const newOtp = generateOtp();
    
    try {
      // Using EmailJS API directly with fetch
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'service_emks25r',
          template_id: 'template_h8r9vlo',
          user_id: 'HiT1qgF3NG4BIwyQY',
          template_params: {
            passcode: newOtp,
            email: email,
          }
        })
      });

      if (response.ok) {
        console.log("✅ OTP sent successfully!");
        setShowOtpModal(true);
        setOtpLoading(false);
        return true;
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (err) {
      console.error("❌ Failed to send OTP:", err);
      setOtpError('Failed to send OTP. Please try again.');
      setOtpLoading(false);
      return false;
    }
  };

  // Verify the entered OTP
  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      setShowOtpModal(false);
      setOtpError('');
      return true;
    } else {
      setOtpError('Invalid OTP. Please try again.');
      return false;
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtpError('');
    await sendOtp(formData.email);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle OTP input change
  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    if (otpError) setOtpError('');
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (mode === 'register') {
      // Username validation
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }

      // Email validation
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Login validation
      if (!formData.identifier.trim()) {
        errors.identifier = 'Username or email is required';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (mode === 'register') {
        // For registration, send OTP first
        const otpSent = await sendOtp(formData.email);
        if (!otpSent) return;
        
        // Don't proceed with registration until OTP is verified
        return;
      } else {
        result = await login(formData.identifier, formData.password);
      }

      if (result.success) {
        onClose();
        resetForm();
      } else if (result.errors) {
        // Handle server validation errors
        const serverErrors = {};
        result.errors.forEach(err => {
          serverErrors[err.param] = err.msg;
        });
        setValidationErrors(serverErrors);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  // Complete registration after OTP verification
  const completeRegistration = async () => {
    if (!otpVerified) {
      setOtpError('Please verify your email first');
      return;
    }

    try {
      const result = await register(formData.username, formData.email, formData.password);
      
      if (result.success) {
        onClose();
        resetForm();
      } else if (result.errors) {
        const serverErrors = {};
        result.errors.forEach(err => {
          serverErrors[err.param] = err.msg;
        });
        setValidationErrors(serverErrors);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      identifier: ''
    });
    setValidationErrors({});
    setOtp('');
    setOtpVerified(false);
    setShowOtpModal(false);
    setOtpError('');
    clearError();
  };

  // Switch between login and register
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  // Close modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Inline styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '400px',
      position: 'relative',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    headerTitle: {
      margin: '0 0 8px 0',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
    },
    headerSubtitle: {
      margin: 0,
      color: '#666',
      fontSize: '14px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontWeight: '500',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    inputError: {
      borderColor: '#e74c3c',
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: '10px',
      top: '10px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '12px',
      marginTop: '4px',
      display: 'block',
    },
    authError: {
      backgroundColor: '#ffe6e6',
      color: '#e74c3c',
      padding: '10px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#4a6cfa',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '8px',
    },
    submitButtonDisabled: {
      backgroundColor: '#b0b0b0',
      cursor: 'not-allowed',
    },
    footer: {
      textAlign: 'center',
      marginTop: '20px',
      fontSize: '14px',
      color: '#666',
    },
    switchButton: {
      background: 'none',
      border: 'none',
      color: '#4a6cfa',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginLeft: '5px',
    },
    completeRegistrationButton: {
      backgroundColor: '#4caf50',
      marginTop: '15px',
    },
    otpModal: {
      maxWidth: '350px',
    },
  };

  return (
    <>
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
          
          <div style={styles.header}>
            <h2 style={styles.headerTitle}>{mode === 'login' ? '🎮 Welcome Back!' : '🚀 Join the Game!'}</h2>
            <p style={styles.headerSubtitle}>{mode === 'login' ? 'Sign in to continue playing' : 'Create your account to start'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div style={styles.formGroup}>
                  <label htmlFor="username" style={styles.label}>👤 Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    style={{...styles.input, ...(validationErrors.username ? styles.inputError : {})}}
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                  {validationErrors.username && (
                    <span style={styles.errorMessage}>{validationErrors.username}</span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="email" style={styles.label}>📧 Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{...styles.input, ...(validationErrors.email ? styles.inputError : {})}}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <span style={styles.errorMessage}>{validationErrors.email}</span>
                  )}
                </div>
              </>
            )}

            {mode === 'login' && (
              <div style={styles.formGroup}>
                <label htmlFor="identifier" style={styles.label}>👤 Username or Email</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  style={{...styles.input, ...(validationErrors.identifier ? styles.inputError : {})}}
                  placeholder="Enter username or email"
                  autoComplete="username"
                />
                {validationErrors.identifier && (
                  <span style={styles.errorMessage}>{validationErrors.identifier}</span>
                )}
              </div>
            )}

            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>🔒 Password</label>
              <div style={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{...styles.input, ...(validationErrors.password ? styles.inputError : {})}}
                  placeholder="Enter your password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {validationErrors.password && (
                <span style={styles.errorMessage}>{validationErrors.password}</span>
              )}
            </div>

            {mode === 'register' && (
              <div style={styles.formGroup}>
                <label htmlFor="confirmPassword" style={styles.label}>🔒 Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{...styles.input, ...(validationErrors.confirmPassword ? styles.inputError : {})}}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                {validationErrors.confirmPassword && (
                  <span style={styles.errorMessage}>{validationErrors.confirmPassword}</span>
                )}
              </div>
            )}

            {error && (
              <div style={styles.authError}>
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                ...(loading || otpLoading ? styles.submitButtonDisabled : {})
              }}
              disabled={loading || otpLoading}
            >
              {loading || otpLoading ? (
                <span>⏳ Processing...</span>
              ) : (
                mode === 'login' ? '🎯 Sign In' : '🚀 Send Verification Code'
              )}
            </button>
          </form>

          {mode === 'register' && otpVerified && (
            <button 
              onClick={completeRegistration}
              style={{...styles.submitButton, ...styles.completeRegistrationButton}}
            >
              🎉 Complete Registration
            </button>
          )}

          <div style={styles.footer}>
            <p>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button 
                type="button" 
                style={styles.switchButton}
                onClick={switchMode}
              >
                {mode === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={styles.overlay}>
          <div style={{...styles.modal, ...styles.otpModal}}>
            <button 
              style={styles.closeButton} 
              onClick={() => setShowOtpModal(false)}
            >
              ✕
            </button>
            
            <div style={styles.header}>
              <h2 style={styles.headerTitle}>📧 Verify Your Email</h2>
              <p style={styles.headerSubtitle}>We've sent a verification code to {formData.email}</p>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="otp" style={styles.label}>Enter Verification Code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={handleOtpChange}
                style={styles.input}
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
              {otpError && (
                <span style={styles.errorMessage}>{otpError}</span>
              )}
            </div>

            <button 
              onClick={verifyOtp}
              style={styles.submitButton}
            >
              Verify Code
            </button>

            <div style={styles.footer}>
              <p>
                Didn't receive the code?
                <button 
                  type="button" 
                  style={styles.switchButton}
                  onClick={resendOtp}
                >
                  Resend Code
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthModal;
