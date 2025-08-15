import React from 'react';
import Alert from '@/components/ui/Alert';

const AlertContainer = ({ alerts, onRemove }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`animate-slide-in-right`}
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both'
          }}
        >
          <Alert
            className={`alert-${alert.type}`}
            icon={alert.icon}
            dismissible={alert.dismissible}
            toggle={() => onRemove(alert.id)}
            autoClose={alert.autoClose || 5000}
            hideProgressBar={alert.hideProgressBar || false}
            pauseOnHover={alert.pauseOnHover !== false} // Default true
          >
            <div>
              {alert.title && (
                <div className="font-medium text-sm mb-1">
                  {alert.title}
                </div>
              )}
              <div className="text-sm">
                {alert.message}
              </div>
            </div>
          </Alert>
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;