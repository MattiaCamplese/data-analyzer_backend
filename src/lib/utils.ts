import jwt from 'jsonwebtoken'

export function generateJwt(email: string): string {
  return jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}
