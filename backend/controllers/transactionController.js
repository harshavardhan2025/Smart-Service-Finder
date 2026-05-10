import Transaction from "../models/Transaction.js";

export const getTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.worker) filter.worker = req.query.worker;
    
    const txns = await Transaction.find(filter).sort({ createdAt: -1 });
    res.status(200).json(txns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const txn = await Transaction.create(req.body);
    res.status(201).json({ success: true, transaction: txn });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
