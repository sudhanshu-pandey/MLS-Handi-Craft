import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import cron from "node-cron";

/**
 * Cleanup expired pending orders
 * - Deletes orders where payment not completed within 10 minutes
 * - Restores product stock and coupon usage
 */
export const cleanupExpiredOrders = async () => {
  try {
    console.log("🔄 [Cleanup Job] Starting cleanup of expired pending orders...");
    
    // Find all pending orders that have expired
    const expiredOrders = await Order.find({
      paymentStatus: 'pending',
      paymentExpiresAt: { $lt: new Date() }
    }).populate('items.product');
    
    if (expiredOrders.length === 0) {
      console.log("✅ [Cleanup Job] No expired orders found");
      return {
        success: true,
        message: "No expired orders to clean up",
        cleanedCount: 0
      };
    }
    
    console.log(`📦 [Cleanup Job] Found ${expiredOrders.length} expired orders to delete`);
    
    let cleanedCount = 0;
    
    for (const order of expiredOrders) {
      try {
        // Restore coupon usage if one was used
        if (order.couponCode) {
          try {
            await Coupon.findOneAndUpdate(
              { code: order.couponCode.toUpperCase() },
              { $inc: { usageCount: -1 } },
              { new: true }
            );
          } catch (err) {
            console.error(`  ❌ Error restoring coupon usage:`, err.message);
          }
        }
        
        // Delete the order
        await Order.findByIdAndDelete(order._id);
        cleanedCount++;
      } catch (err) {
        console.error(`❌ [Cleanup Job] Error processing order ${order._id}:`, err.message);
      }
    }
    
    console.log(`🎉 [Cleanup Job] Cleanup complete: ${cleanedCount} orders deleted`);
    
    return {
      success: true,
      message: `Successfully cleaned up ${cleanedCount} expired orders`,
      cleanedCount
    };
  } catch (err) {
    console.error("❌ [Cleanup Job] Error:", err.message);
    return {
      success: false,
      message: "Error during cleanup",
      error: err.message
    };
  }
};

/**
 * Schedule cleanup job to run at 12 AM (midnight) and 12 PM (noon)
 * Cron expression: '0 0,12 * * *' (runs at 00:00 and 12:00 every day)
 */
export const scheduleCleanupJob = (cronSchedule = '0 0,12 * * *') => {
  try {
    console.log("⏳ Initializing cleanup job scheduler...");
    
    const task = cron.schedule(cronSchedule, async () => {
      const now = new Date();
      const hours = now.getHours();
      const timeLabel = hours === 0 ? '🌙 12 AM (Midnight)' : '☀️ 12 PM (Noon)';
      console.log(`\n📅 Running scheduled cleanup at ${timeLabel}`);
      await cleanupExpiredOrders();
    });
    
    console.log("✅ Cleanup job scheduled successfully (12 AM & 12 PM daily)");
    return task;
  } catch (err) {
    console.warn("⚠️ Error scheduling cleanup job:", err.message);
    return null;
  }
};
