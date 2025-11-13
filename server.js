import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';

const {
  PORT = 3000,
  MONGO_URI,
  MONGO_DB_NAME,
  JWT_SECRET = 'devsecret',
  CORS_ORIGIN,
} = process.env;

const DATABASE_NAME = MONGO_DB_NAME && MONGO_DB_NAME.trim().length > 0 ? MONGO_DB_NAME : 'PF';

/**
 * ------------------------------------------------------------------------
 * Annexure Data (kept in this file per requirements)
 * ------------------------------------------------------------------------
 */
const ANNEXURE_EMPLOYERS = [
  { username: '001234567892', password: 'User#@01', establishmentName: 'Suhani Pvt. Ltd.', establishmentId: 'APHYD1234567001', lin: '1234567890' },
  { username: '002234567892', password: 'User#@02', establishmentName: 'Hindustan Packages Pvt. Ltd.', establishmentId: 'APHYD1234567002', lin: '1234567890' },
  { username: '003234567892', password: 'User#@03', establishmentName: 'Ayush Pvt. Ltd.', establishmentId: 'APHYD1234567003', lin: '1234567890' },
  { username: '004234567892', password: 'User#@04', establishmentName: 'Shrishti Electromech Pvt. Ltd.', establishmentId: 'APHYD1234567004', lin: '1234567890' },
  { username: '005234567892', password: 'User#@05', establishmentName: 'Jaguar Solutions Pvt. Ltd.', establishmentId: 'APHYD1234567005', lin: '1234567890' },
  { username: '006234567892', password: 'User#@06', establishmentName: 'Dayalan Pvt. Ltd.', establishmentId: 'APHYD1234567006', lin: '1234567890' },
  { username: '007234567892', password: 'User#@07', establishmentName: 'Hindorson Pvt. Ltd.', establishmentId: 'APHYD1234567007', lin: '1234567890' },
  { username: '008234567892', password: 'User#@08', establishmentName: 'Lekhya Pvt. Ltd.', establishmentId: 'APHYD1234567008', lin: '1234567890' },
  { username: '009234567892', password: 'User#@09', establishmentName: 'I.N Roy Pvt. Ltd.', establishmentId: 'APHYD1234567009', lin: '1234567890' },
  { username: '010234567892', password: 'User#@10', establishmentName: 'Dayakar Pvt. Ltd.', establishmentId: 'APHYD1234567010', lin: '1234567890' },
  { username: '011234567892', password: 'User#@11', establishmentName: 'Hinduja Pvt. Ltd.', establishmentId: 'APHYD1234567011', lin: '1234567890' },
  { username: '012234567892', password: 'User#@12', establishmentName: 'G V R Pvt. Ltd.', establishmentId: 'APHYD1234567012', lin: '1234567890' },
  { username: '013234567892', password: 'User#@13', establishmentName: 'Wol 3D India Pvt. Ltd.', establishmentId: 'APHYD1234567013', lin: '1234567890' },
  { username: '014234567892', password: 'User#@14', establishmentName: 'Karthik Pvt. Ltd.', establishmentId: 'APHYD1234567014', lin: '1234567890' },
  { username: '015234567892', password: 'User#@15', establishmentName: 'Godrej Pvt. Ltd.', establishmentId: 'APHYD1234567015', lin: '1234567890' },
];

const ANNEXURE_BANKS = [
  { name: 'State Bank of India', accountNumber: '6785436735935479', userId: 'Raman Kumar', password: 'Sinha@897' },
  { name: 'Bank of Baroda', accountNumber: '6433348927956839', userId: 'Prasad Shetty', password: 'Shetty_585' },
  { name: 'Punjab National Bank', accountNumber: '4638546753895346', userId: 'Vinod Kumar', password: 'Kumar$999' },
  { name: 'Axis Bank', accountNumber: '5643753275674568', userId: 'Shrishti', password: 'Shrishti*765' },
];

const ANNEXURE_MEMBERS = [
  { name: 'Suhani', uan: '000123456789' },
  { name: 'Deepthi', uan: '000223456789' },
  { name: 'Ayush', uan: '000323456789' },
  { name: 'Shrishti', uan: '000423456789' },
  { name: 'Shruti', uan: '000523456789' },
  { name: 'Deena Dayalan', uan: '000623456789' },
  { name: 'Divyam', uan: '000723456789' },
  { name: 'Aashita', uan: '000823456789' },
  { name: 'Ramavatar', uan: '000923456789' },
  { name: 'Yash', uan: '001023456789' },
  { name: 'Ruthik', uan: '001123456789' },
  { name: 'Poojitha', uan: '001223456789' },
  { name: 'Madhav', uan: '001323456789' },
  { name: 'Vinay', uan: '001423456789' },
  { name: 'Tejaswi', uan: '001523456789' },
];

const IMPORTANT_NOTICE = [
  'Use only alphabets and numbers in file names; remove special characters.',
  'Maximum file size for upload is 8 MB.',
  'If the text file size exceeds 2 MB, compress it using WinZip; smaller files can also be uploaded in ZIP format.',
  'Do not upload other file types such as .jpg, .gif, .doc, .xls, .ppt, etc., inside the ZIP.',
  'Only text files or ZIP files containing one text file can be uploaded.',
  'The file extension must be in lower case (.txt).',
  'For larger files, additional processing time may be required.',
  'After uploading, revisit the page after some time.',
];

const ALLOWED_RETURN_TYPES = ['Regular Return', 'Revised Return', 'Supplementary Return'];
const ALLOWED_CONTRIBUTION_RATES = [10, 12];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * ------------------------------------------------------------------------
 * Express & Middleware Setup
 * ------------------------------------------------------------------------
 */
const app = express();
let databaseStatus = 'disconnected';

app.use(
  cors({
    origin: CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  })
);
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.txt')) {
      return cb(new Error('Only .txt files are supported'));
    }
    cb(null, true);
  },
});

/**
 * ------------------------------------------------------------------------
 * Database Connection & Schemas
 * ------------------------------------------------------------------------
 */
if (!MONGO_URI) {
  console.warn('⚠️  MONGO_URI is not set. Backend will not be able to persist data.');
}

mongoose.set('strictQuery', true);

const returnRecordSchema = new mongoose.Schema(
  {
    uan: String,
    memberName: String,
    grossWages: Number,
    epfWages: Number,
    epsWages: Number,
    edliWages: Number,
    employeePfContribution: Number,
    employerEpsContribution: Number,
    employerPfContribution: Number,
    epfEpsDifference: Number,
    ncpDays: Number,
    refundOfAdvance: Number,
  },
  { _id: false }
);

const returnFileSchema = new mongoose.Schema(
  {
    employerId: { type: String, required: true },
    establishmentName: { type: String },
    lin: { type: String },
    wageMonth: { type: String, required: true }, // format YYYY-MM
    returnType: { type: String, enum: ALLOWED_RETURN_TYPES, required: true },
    contributionRate: { type: Number, enum: ALLOWED_CONTRIBUTION_RATES, required: true },
    remark: { type: String },
    fileName: String,
    fileSize: Number,
    rawFileContent: { type: String },
    status: { type: String, enum: ['uploaded', 'approved', 'rejected'], default: 'uploaded' },
    totals: {
      members: {
        active: Number,
        joined: Number,
        left: Number,
      },
      wages: {
        gross: Number,
        epf: Number,
        eps: Number,
        edli: Number,
      },
      contributions: {
        employeePf: Number,
        employerEps: Number,
        employerPf: Number,
        difference: Number,
        refund: Number,
      },
      ncpDays: Number,
    },
    records: [returnRecordSchema],
    trrn: String,
    challanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challan' },
    uploadedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

const challanSchema = new mongoose.Schema(
  {
    employerId: { type: String, required: true },
    wageMonth: { type: String, required: true },
    returnFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReturnFile', required: true },
    trrn: { type: String, required: true, unique: true },
    accounts: {
      ac1: Number,
      ac2: Number,
      ac10: Number,
      ac21: Number,
      ac22: Number,
    },
    totalAmount: Number,
    status: { type: String, enum: ['due', 'paid', 'cancelled'], default: 'due' },
    preparedAt: { type: Date, default: Date.now },
    paidAt: Date,
    cancelledAt: Date,
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    challanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challan', required: true },
    bank: { type: String, required: true },
    crn: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed'], required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ReturnFile = mongoose.model('ReturnFile', returnFileSchema);
const Challan = mongoose.model('Challan', challanSchema);
const Payment = mongoose.model('Payment', paymentSchema);

/**
 * ------------------------------------------------------------------------
 * Utility Helpers
 * ------------------------------------------------------------------------
 */
const toCurrencyNumber = (value) =>
  Number.isNaN(Number(value)) ? 0 : Number(value);

const formatWageMonth = (input) => {
  if (!input) throw new Error('Wage month is required');

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(input)) {
    return input;
  }

  const parts = input.trim().split(/\s+/);
  if (parts.length === 2) {
    const [monthName, year] = parts;
    const date = new Date(`${monthName} 01 ${year}`);
    if (!Number.isNaN(date.getTime())) {
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      return `${date.getFullYear()}-${month}`;
    }
  }

  throw new Error('Invalid wage month format. Use "Month YYYY" or "YYYY-MM".');
};

const generateTrrn = () => `${randomInt(1e11, 1e12 - 1)}`;
const generateCrn = () => `${randomInt(1e13, 1e14 - 1)}`;

const parseReturnFile = (buffer) => {
  const text = buffer.toString('utf-8').trim();
  if (!text) {
    throw new Error('File Validation Failed.');
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('File Validation Failed.');
  }

  const expectedColumns = 11;
  const records = [];
  let totals = {
    wages: { gross: 0, epf: 0, eps: 0, edli: 0 },
    contributions: { employeePf: 0, employerEps: 0, employerPf: 0, difference: 0, refund: 0 },
    ncpDays: 0,
  };

  for (const line of lines) {
    const parts = line.split('#~#').map((value) => value.trim());

    if (parts.length !== expectedColumns) {
      throw new Error('File Validation Failed.');
    }

    const [uan, memberName] = parts;
    if (!uan || !memberName) {
      throw new Error('File Validation Failed.');
    }

    const [
      _uan,
      _memberName,
      gross,
      epf,
      eps,
      edli = '0',
      employeePf = '0',
      employerEps = '0',
      employerPf = '0',
      ncpDays = '0',
      refund = '0',
    ] = parts;

    const employerEpsValue = toCurrencyNumber(employerEps);
    const employerPfValue = toCurrencyNumber(employerPf);
    const differenceValue = Math.max(employerPfValue - employerEpsValue, 0);

    const record = {
      uan,
      memberName,
      grossWages: toCurrencyNumber(gross),
      epfWages: toCurrencyNumber(epf),
      epsWages: toCurrencyNumber(eps),
      edliWages: toCurrencyNumber(edli),
      employeePfContribution: toCurrencyNumber(employeePf),
      employerEpsContribution: employerEpsValue,
      employerPfContribution: employerPfValue,
      epfEpsDifference: differenceValue,
      ncpDays: Number(ncpDays) || 0,
      refundOfAdvance: toCurrencyNumber(refund),
    };

    totals.wages.gross += record.grossWages;
    totals.wages.epf += record.epfWages;
    totals.wages.eps += record.epsWages;
    totals.wages.edli += record.edliWages;

    totals.contributions.employeePf += record.employeePfContribution;
    totals.contributions.employerEps += employerEpsValue;
    totals.contributions.employerPf += employerPfValue;
    totals.contributions.difference += differenceValue;
    totals.contributions.refund += record.refundOfAdvance;

    totals.ncpDays += record.ncpDays;

    records.push(record);
  }

  return { records, totals };
};

const buildStatementSummary = (returnFileDoc) => {
  const { totals } = returnFileDoc;
  const aggregation = totals ?? {
    contributions: {
      employeePf: 0,
      employerEps: 0,
      employerPf: 0,
      refund: 0,
    },
  };
  return {
    establishmentName: returnFileDoc.establishmentName,
    establishmentId: returnFileDoc.employerId,
    lin: returnFileDoc.lin ?? '1234567890',
    contributionRate: returnFileDoc.contributionRate,
    returnFileId: returnFileDoc.trrn,
    uploadedAt: returnFileDoc.uploadedAt,
    remark: returnFileDoc.remark,
    exemptionStatus: 'Unexempted',
    totals: {
      members: 15,
      epfContribution: aggregation.contributions.employeePf ?? 0,
      epfEpsContribution: aggregation.contributions.employerPf ?? 0,
      epsContribution: aggregation.contributions.employerEps ?? 0,
      refundOfAdvance: aggregation.contributions.refund ?? 0,
    },
    records: returnFileDoc.records,
  };
};

const computeChallanAccounts = (returnFileDoc) => {
  const { totals } = returnFileDoc;

  const ac1 = totals.contributions.employeePf + totals.contributions.difference;
  const adminCharge = Math.max(totals.wages.epf * 0.005, 500);
  const ac2 = Number(adminCharge.toFixed(2));
  const ac10 = totals.contributions.employerEps;
  const ac21 = Number((totals.wages.edli * 0.005).toFixed(2));
  const ac22 = 0;
  const totalAmount = Number((ac1 + ac2 + ac10 + ac21 + ac22).toFixed(2));

  return {
    accounts: { ac1, ac2, ac10, ac21, ac22 },
    totalAmount,
  };
};

const authenticateRequest = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * ------------------------------------------------------------------------
 * Routes - Public
 * ------------------------------------------------------------------------
 */
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    database: databaseStatus,
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: databaseStatus === 'connected' ? 'healthy' : 'degraded',
    database: databaseStatus,
  });
});

app.get('/annexures/notice', (_req, res) => {
  res.json({ notice: IMPORTANT_NOTICE });
});

app.get('/annexures/banks', (_req, res) => {
  res.json({ banks: ANNEXURE_BANKS });
});

app.get('/annexures/members', (_req, res) => {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const members = ANNEXURE_MEMBERS.map((member, index) => ({
    uan: member.uan,
    memberName: member.name,
    dateOfJoining: formatDate('2023-04-01'),
    dateOfExit: '',
    aadhaarStatus: index % 3 === 0 ? 'Not Seeded' : 'Verified',
    pensionMember: 'Yes',
    higherWages: 'No',
    deferredPension: 'No',
    nationality: 'IN',
  }));
  res.json({ members });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const employer = ANNEXURE_EMPLOYERS.find(
    (item) => item.username === username && item.password === password
  );

  if (!employer) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      sub: employer.username,
      employerId: employer.establishmentId,
      establishmentName: employer.establishmentName,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    employer: {
      username: employer.username,
      establishmentId: employer.establishmentId,
      establishmentName: employer.establishmentName,
    },
  });
});

/**
 * ------------------------------------------------------------------------
 * Routes - Authenticated
 * ------------------------------------------------------------------------
 */
app.get('/dashboard', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;

  const [uploadedReturns, approvedReturns, pendingChallans] = await Promise.all([
    ReturnFile.countDocuments({ employerId }),
    ReturnFile.countDocuments({ employerId, status: 'approved' }),
    Challan.countDocuments({ employerId, status: 'due' }),
  ]);

  res.json({
    alerts: [
      { id: 1, message: 'Click here to pay/know details.', link: '/returns' },
      { id: 2, message: 'Digital signature pending for last month.', link: '/returns' },
    ],
    todo: [
      { id: 1, title: 'Upload monthly return', dueDate: null, status: 'pending' },
      { id: 2, title: 'Prepare challan', dueDate: null, status: 'pending' },
    ],
    summary: {
      uploadedReturns,
      approvedReturns,
      pendingChallans,
    },
  });
});

app.get('/returns/monthly', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;

  const returns = await ReturnFile.find({ employerId })
    .sort({ wageMonth: -1 })
    .lean();

  res.json({
    months: returns.map((item, index) => ({
      id: item._id,
      srNo: index + 1,
      wageMonth: item.wageMonth,
      status: item.status,
      members: {
        total: item.records.length,
        active: 15,
        joined: 0,
        left: 0,
      },
      wages: item.totals.wages,
      contributions: item.totals.contributions,
      ncpDays: item.totals.ncpDays,
      returnFile: item.trrn,
      challan: item.challanId,
    })),
  });
});

app.post(
  '/returns/upload',
  authenticateRequest,
  upload.single('returnFile'),
  async (req, res) => {
    try {
      const employerId = req.user.employerId;
      const establishment = ANNEXURE_EMPLOYERS.find(
        (emp) => emp.establishmentId === employerId
      );

      const { wageMonth, returnType, contributionRate, remark } = req.body ?? {};

      if (!req.file) {
        return res.status(400).json({ message: 'Return file is required' });
      }

      const normalizedReturnType = returnType ?? ALLOWED_RETURN_TYPES[0];
      if (normalizedReturnType !== 'Regular Return') {
        return res.status(400).json({ message: 'Only "Regular Return" is allowed.' });
      }

      const normalizedContributionRate = Number(contributionRate ?? 12);
      if (!ALLOWED_CONTRIBUTION_RATES.includes(normalizedContributionRate)) {
        return res
          .status(400)
          .json({ message: `Contribution rate must be one of ${ALLOWED_CONTRIBUTION_RATES.join(', ')}` });
      }

      const normalizedWageMonth = formatWageMonth(wageMonth);
      const { records, totals } = parseReturnFile(req.file.buffer);

      const existingReturn = await ReturnFile.findOne({
        employerId,
        wageMonth: normalizedWageMonth,
      });

      if (existingReturn) {
        if (existingReturn.status !== 'rejected') {
          return res.status(400).json({
            message: 'Return for this wage month already exists',
            existingReturnId: existingReturn._id,
          });
        }
        await ReturnFile.deleteOne({ _id: existingReturn._id });
      }

      const returnFile = await ReturnFile.create({
        employerId,
        wageMonth: normalizedWageMonth,
        returnType: normalizedReturnType,
        contributionRate: normalizedContributionRate,
        remark,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        rawFileContent: req.file.buffer.toString('utf-8'),
        status: 'uploaded',
        totals: {
          members: {
            active: 15,
            joined: 0,
            left: 0,
          },
          wages: totals.wages,
          contributions: totals.contributions,
          ncpDays: totals.ncpDays,
        },
        records,
        establishmentName: establishment?.establishmentName,
        lin: establishment?.lin ?? '1234567890',
        trrn: generateTrrn(),
      });

      res.json({
        message: 'File Validation Successful. File processing is in progress and may take more time. Please revisit after some time.',
        returnFileId: returnFile._id,
        status: returnFile.status,
        trrn: returnFile.trrn,
        totals: returnFile.totals,
      });
    } catch (error) {
      res.status(400).json({ message: error.message ?? 'File Validation Failed.' });
    }
  }
);

app.get('/returns/files', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const statusLabels = {
    uploaded: 'Return Statement Generated',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const { wageMonth } = req.query ?? {};
  const query = { employerId };
  if (wageMonth) {
    try {
      query.wageMonth = formatWageMonth(wageMonth);
    } catch {
      return res.status(400).json({ message: 'Invalid wage month format' });
    }
  }

  const files = await ReturnFile.find(query).sort({ uploadedAt: -1 }).lean();

  const mapFile = (file, index) => ({
    id: file._id,
    srNo: index + 1,
    trrn: file.trrn,
    wageMonth: file.wageMonth,
    returnType: file.returnType,
    contributionRate: file.contributionRate,
    status: file.status,
    statusLabel: statusLabels[file.status] ?? file.status,
    uploadedOn: file.uploadedAt,
    remark: file.remark ?? '',
    returnFileName: file.fileName ?? '',
    challanId: file.challanId,
  });

  const inProcessFiles = files.filter((file) => file.status === 'uploaded');
  const recentFiles = files.filter((file) => file.status !== 'uploaded');

  res.json({
    inProcess: inProcessFiles.map(mapFile),
    recent: recentFiles.map(mapFile),
  });
});

app.get('/returns/:id', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const returnFile = await ReturnFile.findOne({ _id: req.params.id, employerId }).lean();

  if (!returnFile) {
    return res.status(404).json({ message: 'Return not found' });
  }

  let challanStatus = null;
  if (returnFile.challanId) {
    const challan = await Challan.findOne({ _id: returnFile.challanId }).lean();
    challanStatus = challan?.status ?? null;
  }

  res.json({
    ...returnFile,
    statement: buildStatementSummary(returnFile),
    challanStatus,
  });
});

app.get('/returns/:id/file', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const returnFile = await ReturnFile.findOne({ _id: req.params.id, employerId }).lean();

  if (!returnFile) {
    return res.status(404).json({ message: 'Return not found' });
  }

  if (!returnFile.rawFileContent) {
    return res.status(404).json({ message: 'Return file content unavailable' });
  }

  const fileName = returnFile.fileName ?? `${returnFile.trrn ?? 'return'}.txt`;
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `attachment; filename="${fileName}"`,
  });
  res.send(returnFile.rawFileContent);
});

app.post('/returns/:id/reject', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const { reason } = req.body ?? {};

  const returnFile = await ReturnFile.findOne({ _id: req.params.id, employerId });
  if (!returnFile) {
    return res.status(404).json({ message: 'Return not found' });
  }

  if (returnFile.status !== 'uploaded') {
    return res.status(400).json({ message: 'Only uploaded returns can be rejected' });
  }

  const trrn = returnFile.trrn;
  await ReturnFile.deleteOne({ _id: returnFile._id });

  res.json({
    message: `Return File [Id = ${trrn}] rejected successfully.`,
    reason: reason ?? 'Return rejected by employer',
  });
});

app.post('/returns/:id/approve', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const returnFile = await ReturnFile.findOne({ _id: req.params.id, employerId });

  if (!returnFile) {
    return res.status(404).json({ message: 'Return not found' });
  }

  if (returnFile.status !== 'uploaded') {
    return res.status(400).json({ message: 'Return cannot be approved in its current state' });
  }

  const { accounts, totalAmount } = computeChallanAccounts(returnFile);
  const challan = await Challan.create({
    employerId,
    wageMonth: returnFile.wageMonth,
    returnFileId: returnFile._id,
    trrn: returnFile.trrn,
    accounts,
    totalAmount,
    status: 'due',
  });

  returnFile.status = 'approved';
  returnFile.approvedAt = new Date();
  returnFile.challanId = challan._id;
  await returnFile.save();

  res.json({
    message: `Return File Id [${returnFile.trrn}] approved successfully. Kindly prepare the challan using appropriate payment option.`,
    challanId: challan._id,
    challan,
  });
});

app.get('/challans', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const challans = await Challan.find({ employerId }).sort({ preparedAt: -1 }).lean();

  const paymentIds = challans
    .map((challan) => challan.paymentId?.toString())
    .filter((id) => Boolean(id));

  let paymentsById = {};
  if (paymentIds.length > 0) {
    const payments = await Payment.find({ _id: { $in: paymentIds } })
      .select(['_id', 'crn', 'status', 'bank', 'amount', 'processedAt'])
      .lean();
    paymentsById = payments.reduce((acc, payment) => {
      acc[payment._id.toString()] = payment;
      return acc;
    }, {});
  }

  const enriched = challans.map((challan) => ({
    ...challan,
    payment: challan.paymentId ? paymentsById[challan.paymentId.toString()] ?? null : null,
  }));

  res.json({ challans: enriched });
});

// Validate bank credentials before payment
app.post('/challans/validate-bank', authenticateRequest, async (req, res) => {
  const { bankName, username, password, challanId } = req.body ?? {};

  if (!bankName || !username || !password) {
    return res.status(400).json({ valid: false, message: 'Bank name, username, and password are required' });
  }

  const bank = ANNEXURE_BANKS.find((b) => b.name === bankName);
  if (!bank) {
    return res.status(400).json({ valid: false, message: 'Selected bank is not supported' });
  }

  // Validate credentials against Annexure 3
  if (bank.userId === username && bank.password === password) {
    // Check if challan exists and is valid
    if (challanId) {
      const employerId = req.user.employerId;
      const challan = await Challan.findOne({ _id: challanId, employerId });
      if (!challan) {
        return res.status(404).json({ valid: false, message: 'Challan not found' });
      }
      if (challan.status !== 'due') {
        return res.status(400).json({ valid: false, message: 'Challan is not available for payment' });
      }
    }

    res.json({
      valid: true,
      message: 'Bank credentials validated successfully',
      bankDetails: {
        name: bank.name,
        accountNumber: bank.accountNumber,
        userId: bank.userId,
      },
    });
  } else {
    res.status(401).json({
      valid: false,
      message: 'Invalid banking credentials. Please check your username and password.',
    });
  }
});

app.post('/challans/:id/pay', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const { bankName } = req.body ?? {};

  if (!bankName) {
    return res.status(400).json({ message: 'Bank selection is required' });
  }

  if (!ANNEXURE_BANKS.find((bank) => bank.name === bankName)) {
    return res.status(400).json({ message: 'Selected bank is not supported' });
  }

  const challan = await Challan.findOne({ _id: req.params.id, employerId });
  if (!challan) {
    return res.status(404).json({ message: 'Challan not found' });
  }

  if (challan.status !== 'due') {
    return res.status(400).json({ message: 'Only due challans can be paid' });
  }

  const payment = await Payment.create({
    challanId: challan._id,
    bank: bankName,
    crn: generateCrn(),
    amount: challan.totalAmount,
    status: 'success',
  });

  challan.status = 'paid';
  challan.paidAt = new Date();
  challan.paymentId = payment._id;
  await challan.save();

  res.json({
    message: 'Transaction Successful',
    challanId: challan._id,
    payment: {
      id: payment._id,
      status: payment.status,
      crn: payment.crn,
      bank: payment.bank,
      amount: payment.amount,
    },
  });
});

app.post('/challans/:id/cancel', authenticateRequest, async (req, res) => {
  const employerId = req.user.employerId;
  const challan = await Challan.findOne({ _id: req.params.id, employerId });

  if (!challan) {
    return res.status(404).json({ message: 'Challan not found' });
  }

  if (challan.status !== 'due') {
    return res.status(400).json({ message: 'Only due challans can be cancelled' });
  }

  challan.status = 'cancelled';
  challan.cancelledAt = new Date();
  await challan.save();

  res.json({
    message: 'Challan cancelled successfully',
    challanId: challan._id,
  });
});

/**
 * ------------------------------------------------------------------------
 * Error Handling
 * ------------------------------------------------------------------------
 */
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
  } else if (err) {
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

/**
 * ------------------------------------------------------------------------
 * Server Bootstrap
 * ------------------------------------------------------------------------
 */
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }

    const connection = await mongoose.connect(MONGO_URI, {
      dbName: DATABASE_NAME,
    });

    databaseStatus = connection.connection.readyState === 1 ? 'connected' : 'connecting';

    connection.connection.on('connected', () => {
      databaseStatus = 'connected';
      console.log('MongoDB connected');
      console.log(`→ Database in use: ${DATABASE_NAME}`);
    });

    connection.connection.on('disconnected', () => {
      databaseStatus = 'disconnected';
      console.warn('MongoDB disconnected');
    });

    connection.connection.on('error', (error) => {
      databaseStatus = 'error';
      console.error('MongoDB error:', error);
    });

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    databaseStatus = 'error';
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
