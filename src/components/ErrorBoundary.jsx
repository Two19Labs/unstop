import React from 'react';
import { captureException } from '../lib/posthog';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
    captureException(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9F8F6',
            color: '#1A1A19',
            fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: '24px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E6E2',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px'
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#1A1A19'
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#75736C',
                lineHeight: 1.5
              }}
            >
              OneStop encountered an unexpected rendering error. You can reload or reset your local state to continue.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#F2F1ED',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '24px',
                  fontSize: '12px',
                  color: '#55534D',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '120px'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0F3FFE',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload OneStop
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#55534D',
                  border: '1px solid #E7E6E2',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
