import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Token payload interfaces
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  tokenId: string;
}

// Generate Access Token (1 hour expiry)
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    role,
    type: 'access'
  };
  
  const secret = process.env.JWT_SECRET as string;
  const options = {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  } as SignOptions;
  return jwt.sign(payload, secret, options);
};

// Generate Refresh Token (7 days expiry)
export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    tokenId: crypto.randomBytes(16).toString('hex')
  };
  
  const secret = process.env.JWT_REFRESH_SECRET as string;
  const options = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  } as SignOptions;
  return jwt.sign(payload, secret, options);
};

// Verify Access Token
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
  } catch (error) {
    throw error;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
  } catch (error) {
    throw error;
  }
};

// Generate Email Verification Token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate Password Reset Token
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
