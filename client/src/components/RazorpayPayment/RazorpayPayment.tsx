import { useEffect, useState } from 'react';
import { FiCreditCard, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';
import razorpayService from '../../services/razorpay.service';
import styles from './RazorpayPayment.module.css';

interface RazorpayPaymentProps {
  orderId: string;
  amount: number;
  userEmail: string;
  userPhone: string;
  userName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

const RazorpayPayment = ({
  orderId,
  amount,
  userEmail,
  userPhone,
  userName,
  onSuccess,
  onError,
  isProcessing,
}: RazorpayPaymentProps) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = async () => {
    try {
      const isLoaded = await razorpayService.loadRazorpayScript();
      setScriptLoaded(isLoaded);
      if (!isLoaded) {
        setPaymentStatus('error');
        setStatusMessage('Failed to load Razorpay. Please refresh the page.');
      }
    } catch (error) {
      setPaymentStatus('error');
      setStatusMessage('Error loading payment gateway');
    }
  };

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setPaymentStatus('error');
      setStatusMessage('Payment gateway not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');
    setStatusMessage('Initializing payment...');

    try {
      console.log("Starting payment process for order:", orderId, "amount:", amount);
      
      // Create Razorpay order
      const orderResponse = await razorpayService.createOrder(amount, orderId);
      console.log("Order response received:", orderResponse);

      setStatusMessage('Opening payment gateway...');

      // Prepare checkout options - only use valid Razorpay fields
      const options = {
        key: orderResponse.keyId,
        order_id: orderResponse.razorpayOrder.id,
        prefill: {
          name: userName || 'Customer',
          email: userEmail || '',
          contact: userPhone || '',
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: '#667eea',
        },
      };

      console.log("Opening checkout with options:", options);

      // Open Razorpay checkout
      const response = await razorpayService.openCheckout(options);

      // Verify payment with backend
      setStatusMessage('Verifying payment...');
      const verifyResponse = await razorpayService.verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });

      setPaymentStatus('success');
      setStatusMessage('Payment successful! 🎉');
      setIsLoading(false);
      onSuccess(verifyResponse);
    } catch (error: any) {
      console.error("Payment error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: (error as any).response
      });
      setPaymentStatus('error');
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setStatusMessage(errorMessage);
      setIsLoading(false);
      onError(errorMessage);
    }
  };

  return (
    <div className={styles.simpleContainer}>
      <div className={styles.amountSection}>
        <span className={styles.label}>Amount to Pay</span>
        <h1 className={styles.amount}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
      </div>

      {/* Status Messages */}
      {paymentStatus === 'error' && (
        <div className={styles.statusMessage} style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}>
          <FiAlertCircle size={20} />
          <span>{statusMessage}</span>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className={styles.statusMessage} style={{ backgroundColor: '#DBEAFE', borderColor: '#93C5FD', color: '#1E40AF' }}>
          <FiCheck size={20} />
          <span>{statusMessage}</span>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <div className={styles.statusMessage} style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>
          <FiLoader size={20} className={styles.spinner} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Pay Button */}
      <button
        className={styles.payButton}
        onClick={handlePayment}
        disabled={isLoading || !scriptLoaded || paymentStatus === 'success' || isProcessing}
      >
        {isLoading ? (
          <>
            <FiLoader size={18} className={styles.spinner} />
            Processing...
          </>
        ) : paymentStatus === 'success' ? (
          <>
            <FiCheck size={18} />
            Payment Successful
          </>
        ) : (
          <>
            <FiCreditCard size={18} />
            Pay ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </>
        )}
      </button>

      {/* Security Info */}
      <div className={styles.securityInfo}>
        <p>🔒 Your payment is secured with 256-bit encryption</p>
        <p>✓ All payment methods supported (UPI, Card, NetBanking, Wallet & more)</p>
        <p>✓ Powered by Razorpay</p>
      </div>
    </div>
  );
};

export default RazorpayPayment;
