import Razorpay from "razorpay"
import crypto from "crypto"
import Donation from "../models/donation.model.js"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_K7jGjlPd8u8F7h",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
})

// Create Razorpay donation order
export const createDonationOrder = async (req, res) => {
  try {
    const { amount, donorName, donorEmail, message } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" })
    }

    if (!donorName || !donorEmail) {
      return res.status(400).json({ success: false, message: "Missing donor details" })
    }

    console.log("Creating Razorpay order for donation:", { amount, donorName, donorEmail })

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `donation_${Date.now()}`,
      notes: {
        donorName,
        donorEmail,
        message: message || "",
      },
    })

    console.log("Razorpay order created:", razorpayOrder.id)

    // Create preliminary donation record with pending status
    const donation = new Donation({
      donorName,
      donorEmail,
      amount,
      currency: "INR",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
      message: message || "",
    })

    await donation.save()
    console.log("Donation record created with ID:", donation._id)

    res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount,
        currency: "INR",
        donationId: donation._id,
      },
    })
  } catch (error) {
    console.error("Error creating donation order:", error)
    res.status(500).json({
      success: false,
      message: "Error creating donation order",
      error: error.message,
    })
  }
}

// Verify donation payment and signature
export const verifyDonationPayment = async (req, res) => {
  try {
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      donorName,
      donorEmail,
      amount,
      message,
      inMemory,
      memoryName,
      wantsReceipt,
    } = req.body

    console.log("Verifying donation payment:", {
      razorpayPaymentId,
      razorpayOrderId,
      amount,
    })

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "test_secret"
    const shasum = crypto.createHmac("sha256", key_secret)
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`)
    const digest = shasum.digest("hex")

    console.log("Signature verification:", {
      providedSignature: razorpaySignature,
      calculatedSignature: digest,
      match: digest === razorpaySignature,
    })

    if (digest !== razorpaySignature) {
      console.error("Signature mismatch!")
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment not verified.",
      })
    }

    // Update donation record with payment details
    const donation = await Donation.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus: "completed",
        donorName,
        donorEmail,
        amount,
        message: message || "",
        inMemory: inMemory || false,
        memoryName: memoryName || "",
        wantsReceipt: wantsReceipt !== undefined ? wantsReceipt : true,
        donatedAt: new Date(),
      },
      { new: true }
    )

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation record not found",
      })
    }

    console.log("Donation verified and updated:", donation._id)

    // TODO: Send receipt email if wantsReceipt is true
    if (wantsReceipt) {
      console.log("TODO: Send receipt email to", donorEmail)
      // emailService.sendDonationReceipt(donorEmail, donation)
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and donation recorded successfully",
      data: {
        donationId: donation._id,
        amount: donation.amount,
        status: donation.paymentStatus,
      },
    })
  } catch (error) {
    console.error("Error verifying donation payment:", error)
    res.status(500).json({
      success: false,
      message: "Error verifying donation payment",
      error: error.message,
    })
  }
}

// Get user's donation history
export const getUserDonations = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const donorEmail = req.query.email || req.user?.email

    console.log("Fetching donations for user:", { userId, donorEmail })

    const query = {}
    if (userId) query.user = userId
    if (donorEmail) query.donorEmail = donorEmail

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .select("-razorpaySignature") // Don't expose signature

    res.status(200).json({
      success: true,
      data: donations,
      total: donations.length,
    })
  } catch (error) {
    console.error("Error fetching user donations:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching user donations",
      error: error.message,
    })
  }
}

// Get public donation statistics
export const getDonationStats = async (req, res) => {
  try {
    console.log("Fetching donation statistics")

    const totalDonations = await Donation.countDocuments({
      paymentStatus: "completed",
    })

    const totalAmount = await Donation.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const uniqueDonors = await Donation.distinct("donorEmail", {
      paymentStatus: "completed",
    })

    const stats = {
      totalDonations,
      totalAmount: totalAmount[0]?.total || 0,
      uniqueDonors: uniqueDonors.length,
      averageDonation:
        totalDonations > 0 ? Math.round((totalAmount[0]?.total || 0) / totalDonations) : 0,
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching donation stats:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching donation statistics",
      error: error.message,
    })
  }
}
