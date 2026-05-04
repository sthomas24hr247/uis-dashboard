// src/context/JurisdictionContext.tsx
// Resolves and provides jurisdiction data for the active practice
// Drives all label swaps, currency display, payer names, and fee schedule references

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

export interface Jurisdiction {
  country: 'US' | 'CA';
  province_state: string;
  currency: 'USD' | 'CAD';
  currency_symbol: string;
  fee_schedule: 'CDT' | 'ODA' | 'BCDA' | 'ADA_AB';
  code_format: 'D####' | '#####';
  public_payer: string;
  private_payers: string[];
  prior_auth_framework: string;
  claim_form: string;
  validation_ruleset: 'DENTI_CAL' | 'CDCP' | 'GENERIC_CA' | 'GENERIC_US';
  predetermination_label: string;
  payer_label: string;
  province_label: string;
}

export interface PracticeJurisdiction {
  practice_id: string;
  name: string;
  country: string;
  province_state: string;
  jurisdiction: Jurisdiction;
}

interface JurisdictionContextType {
  // Active practice jurisdiction (based on user.practiceId)
  jurisdiction: Jurisdiction | null;
  // All practices (for multi-practice views)
  allPractices: PracticeJurisdiction[];
  isLoading: boolean;
  isCanada: boolean;
  isUS: boolean;
  // Helper: format currency for active jurisdiction
  formatCurrency: (amount: number) => string;
  // Helper: get jurisdiction for a specific practice
  getJurisdiction: (practiceId: string) => Jurisdiction | null;
  // Refresh (call after updating practice jurisdiction in settings)
  refresh: () => void;
}

const DEFAULT_US_JURISDICTION: Jurisdiction = {
  country: 'US',
  province_state: 'CA',
  currency: 'USD',
  currency_symbol: '$',
  fee_schedule: 'CDT',
  code_format: 'D####',
  public_payer: 'Denti-Cal',
  private_payers: ['Delta Dental', 'Anthem Blue Cross', 'Cigna', 'MetLife', 'Guardian'],
  prior_auth_framework: 'MOC §8.1.145 / APL 23-028',
  claim_form: 'ADA Dental Claim Form',
  validation_ruleset: 'DENTI_CAL',
  predetermination_label: 'Prior Authorization',
  payer_label: 'Insurance',
  province_label: 'State',
};

const JurisdictionContext = createContext<JurisdictionContextType | undefined>(undefined);

export const JurisdictionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allPractices, setAllPractices] = useState<PracticeJurisdiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const fetchJurisdictions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/practice/jurisdiction`);
        if (res.ok) {
          const data = await res.json();
          setAllPractices(data.practices || []);
        }
      } catch {
        // Silently fail — defaults apply
      } finally {
        setIsLoading(false);
      }
    };
    fetchJurisdictions();
  }, [refreshTick]);

  // Resolve active practice jurisdiction
  const activePractice = user?.practiceId
    ? allPractices.find(p => p.practice_id === user.practiceId)
    : allPractices[0];

  const jurisdiction = activePractice?.jurisdiction || DEFAULT_US_JURISDICTION;

  const isCanada = jurisdiction.country === 'CA';
  const isUS = jurisdiction.country === 'US';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(isCanada ? 'en-CA' : 'en-US', {
      style: 'currency',
      currency: jurisdiction.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getJurisdiction = (practiceId: string): Jurisdiction | null => {
    return allPractices.find(p => p.practice_id === practiceId)?.jurisdiction || null;
  };

  const refresh = () => setRefreshTick(t => t + 1);

  return (
    <JurisdictionContext.Provider value={{
      jurisdiction,
      allPractices,
      isLoading,
      isCanada,
      isUS,
      formatCurrency,
      getJurisdiction,
      refresh,
    }}>
      {children}
    </JurisdictionContext.Provider>
  );
};

export const useJurisdiction = (): JurisdictionContextType => {
  const ctx = useContext(JurisdictionContext);
  if (!ctx) throw new Error('useJurisdiction must be used within JurisdictionProvider');
  return ctx;
};

// Convenience hook for just the active jurisdiction
export const useActiveJurisdiction = (): Jurisdiction => {
  const { jurisdiction } = useJurisdiction();
  return jurisdiction || DEFAULT_US_JURISDICTION;
};
