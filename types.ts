
export interface ObservableResult {
  ns: number;
  r: number;
  As: number;
  nt: number;
  alpha_s: number;
}

export interface SpectrumPoint {
  k: number;
  scalar: number;
  tensor: number;
}

export interface DerivationStep {
  title: string;
  content: string;
  equation?: string;
}

export interface CalculationResponse {
  theoryName: string;
  potentialForm: string;
  derivationSteps: DerivationStep[];
  observables: ObservableResult;
  spectrumData: SpectrumPoint[];
  interpretation: string;
}

export enum CalculationStatus {
  IDLE = 'IDLE',
  DERIVING = 'DERIVING',
  CALCULATING = 'CALCULATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
