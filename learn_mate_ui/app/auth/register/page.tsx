'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore(state => state.register);
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as const,
    first_name: '',
    last_name: '',
    grade_level: 8,
    preferred_language: 'en',
  });
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.push('/dashboard');
    } catch (err: any) {
      const responseData = err.response?.data;
      
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errors: Record<string, string> = {};
        responseData.errors.forEach((error: any) => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
        setError('Please fix the validation errors below');
      } else {
        setError(responseData?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('registerTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('registerDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{tCommon('firstName')}</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => updateFormData('first_name', e.target.value)}
                  required
                  disabled={isLoading}
                  className={fieldErrors.first_name ? 'border-red-500' : ''}
                />
                {fieldErrors.first_name && (
                  <p className="text-sm text-red-500">{fieldErrors.first_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">{tCommon('lastName')}</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => updateFormData('last_name', e.target.value)}
                  required
                  disabled={isLoading}
                  className={fieldErrors.last_name ? 'border-red-500' : ''}
                />
                {fieldErrors.last_name && (
                  <p className="text-sm text-red-500">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">{tCommon('username')}</Label>
              <Input
                id="username"
                placeholder={t('usernamePlaceholder')}
                value={formData.username}
                onChange={(e) => updateFormData('username', e.target.value)}
                required
                disabled={isLoading}
                className={fieldErrors.username ? 'border-red-500' : ''}
              />
              {fieldErrors.username && (
                <p className="text-sm text-red-500">{fieldErrors.username}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
                disabled={isLoading}
                className={fieldErrors.email ? 'border-red-500' : ''}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">{tCommon('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  disabled={isLoading}
                  className={fieldErrors.password ? 'border-red-500' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade_level">{t('gradeLevel')}</Label>
                <Select
                  value={formData.grade_level.toString()}
                  onValueChange={(value) => updateFormData('grade_level', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className={fieldErrors.grade_level ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.grade_level && (
                  <p className="text-sm text-red-500">{fieldErrors.grade_level}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t('preferredLanguage')}</Label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value) => updateFormData('preferred_language', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                t('registerTitle')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              {t('signIn')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
