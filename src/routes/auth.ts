import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

router.post('/login', async (req, res) => {
  try {
    // ✅ Accept multiple field name variations
    const { email, emailOrHospitalId, password } = req.body;
    const loginIdentifier = email || emailOrHospitalId;

    console.log('📧 Login attempt:', loginIdentifier);

    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password required' 
      });
    }

    // Find hospital by email
    const hospital = await prisma.hospital.findUnique({
      where: { email: loginIdentifier }
    });

    console.log('🏥 Hospital found:', hospital ? hospital.name : 'NONE');

    if (!hospital) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, hospital.passwordHash);
    
    console.log('🔑 Password valid:', valid);

    if (!valid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT with 'sub' field for hospitalId
    const token = jwt.sign(
      {
        sub: hospital.id,  // ← IMPORTANT: Must be 'sub' to match middleware
        email: hospital.email,
        name: hospital.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', hospital.name);

    res.json({
      success: true,
      token,  // ← Send token directly (LoginPage expects this)
      hospital: {
        id: hospital.id,
        name: hospital.name,
        email: hospital.email
      }
    });
  } catch (error: any) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;