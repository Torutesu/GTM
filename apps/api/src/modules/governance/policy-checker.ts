import { Injectable } from '@nestjs/common';

const HARD_BLOCK_PATTERNS = [
  /child\s*(porn|nude|naked|sex|video|画像)/i,
  /未成年\s*(ポルノ|ヌード|性的)/i,
  /terror|bomb|weapon|殺害|爆発/i,
  /credit\s*card|ssn|passport|クレジットカード/i,
  /(drug|cocaine|heroin|麻薬|覚醒剤)/i,
  /(self[- ]?harm|suicide|自殺|自傷)/i,
  /(child\s*abuse|児童虐待)/i,
];

const SOFT_WARN_PATTERNS = [
  /(Trump|Biden|岸田|バイデン|トランプ)/i,
  /(election|vote|選挙)/i,
  /(race|ethnic|宗教|sex|gender|性別)/i,
  /(nude|naked|sexy|セクシー)/i,
  /(hate|ヘイト|差別|discriminat)/i,
];

export type PolicyResult = {
  passed: boolean;
  severity: 'pass' | 'warn' | 'block';
  violations: { pattern: string; type: 'hard' | 'soft' }[];
};

@Injectable()
export class PolicyChecker {
  check(text: string): PolicyResult {
    const violations: { pattern: string; type: 'hard' | 'soft' }[] = [];

    for (const pattern of HARD_BLOCK_PATTERNS) {
      if (pattern.test(text)) {
        violations.push({ pattern: pattern.source, type: 'hard' });
      }
    }

    for (const pattern of SOFT_WARN_PATTERNS) {
      if (pattern.test(text)) {
        violations.push({ pattern: pattern.source, type: 'soft' });
      }
    }

    const hasHard = violations.some((v) => v.type === 'hard');
    const hasSoft = violations.some((v) => v.type === 'soft');

    return {
      passed: !hasHard,
      severity: hasHard ? 'block' : hasSoft ? 'warn' : 'pass',
      violations,
    };
  }
}
