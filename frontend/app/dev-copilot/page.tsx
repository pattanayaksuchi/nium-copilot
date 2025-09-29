'use client';

import { useMemo, useState } from 'react';

type Citation = {
  title: string;
  url: string;
  snippet: string;
};

type ChatResponse = {
  answer: string;
  citations: Citation[];
};

type ValidationError = {
  path: string;
  message: string;
};

type ValidateResponse = {
  valid: boolean;
  errors: ValidationError[];
};

const chatExamples = [
  'Mandatory fields for KRW payouts',
  'Routing requirements for JPY payouts',
  'USD to US payout payload schema',
];

const validationExamples = [
  {
    label: 'USD / US',
    currency: 'USD',
    country: 'US',
    payload: {
      beneficiary: {
        accountNumber: '1234567890',
        routingNumber: '026009593',
      },
      amount: {
        currency: 'USD',
        value: 100,
      },
    },
  },
  {
    label: 'JPY / JP',
    currency: 'JPY',
    country: 'JP',
    payload: {
      beneficiary: {
        accountNumber: '1234567',
        bankCode: '0001',
        branchCode: '234',
      },
    },
  },
  {
    label: 'KRW / KR',
    currency: 'KRW',
    country: 'KR',
    payload: {
      beneficiary: {
        accountNumber: '12345678901234',
      },
    },
  },
];

const DEFAULT_VALIDATE_PAYLOAD = JSON.stringify(validationExamples[0].payload, null, 2);
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type CodeBlock = {
  language: string;
  code: string;
};

const extractCodeBlocks = (answer: string): CodeBlock[] => {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(answer)) !== null) {
    blocks.push({
      language: (match[1] || '').toLowerCase(),
      code: match[2].trim(),
    });
  }
  return blocks;
};

async function copyText(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Swallow clipboard errors silently; no-op for unsupported environments.
  }
}

import { ConversationSidebar } from '../../src/components/ConversationSidebar';
import { ChatInterface } from '../../src/components/ChatInterface';
import { AppShell } from '../../src/components/AppShell';

export default function DevCopilotPage() {
  return (
    <AppShell sidebar={<ConversationSidebar />}>
      <ChatInterface />
    </AppShell>
  );
}

function LegacyDevCopilotPage() {
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);

  const [currency, setCurrency] = useState<string>('USD');
  const [country, setCountry] = useState<string>('US');
  const [method, setMethod] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [payload, setPayload] = useState<string>(DEFAULT_VALIDATE_PAYLOAD);
  const [validateLoading, setValidateLoading] = useState<boolean>(false);
  const [validateError, setValidateError] = useState<string>('');
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null);

  const codeBlocks = useMemo(() => {
    if (!chatResult?.answer) return [];
    return extractCodeBlocks(chatResult.answer).filter((block) =>
      ['json', 'javascript', 'curl', 'bash'].includes(block.language)
    );
  }, [chatResult]);

  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    setChatError('');
    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Request failed');
      }
      const data = (await response.json()) as ChatResponse;
      setChatResult(data);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleValidateSubmit = async () => {
    setValidateLoading(true);
    setValidateError('');
    try {
      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        throw new Error('Payload must be valid JSON.');
      }
      const response = await fetch(`${backendUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
          country,
          method: method || null,
          channel: channel || null,
          payload: parsedPayload,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Validation failed');
      }
      const data = (await response.json()) as ValidateResponse;
      setValidateResult(data);
    } catch (error) {
      setValidateError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setValidateLoading(false);
    }
  };

  return (
    <div className="grid">
      <section className="section">
        <h2>Chat</h2>
        <div className="button-row">
          {chatExamples.map((example) => (
            <button
              key={example}
              className="pill"
              type="button"
              onClick={() => setChatMessage(example)}
            >
              {example}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Ask about corridors, payload keys, or payout flows..."
          value={chatMessage}
          onChange={(event) => setChatMessage(event.target.value)}
        />
        <button className="primary" type="button" onClick={handleChatSubmit} disabled={chatLoading}>
          {chatLoading ? 'Thinking...' : 'Ask Copilot'}
        </button>
        {chatError && <div className="error-text">{chatError}</div>}
        {chatResult && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="answer-block">{chatResult.answer}</div>
            <div className="citations">
              {chatResult.citations.map((citation) => (
                <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer">
                  {citation.title || citation.url}
                </a>
              ))}
            </div>
            {codeBlocks.length > 0 && (
              <div className="button-row" style={{ marginTop: '1rem' }}>
                {codeBlocks.map((block, index) => (
                  <button
                    key={`${block.language}-${index}`}
                    className="copy-action"
                    type="button"
                    onClick={() => copyText(block.code)}
                  >
                    Copy {block.language.toUpperCase()} snippet
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Validate Payload</h2>
        <div className="button-row">
          {validationExamples.map((example) => (
            <button
              key={example.label}
              className="pill"
              type="button"
              onClick={() => {
                setCurrency(example.currency);
                setCountry(example.country);
                setPayload(JSON.stringify(example.payload, null, 2));
              }}
            >
              {example.label}
            </button>
          ))}
        </div>
        <div className="grid" style={{ gap: '1rem' }}>
          <div>
            <label htmlFor="currency">Currency</label>
            <input
              id="currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label htmlFor="country">Country</label>
            <input
              id="country"
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label htmlFor="method">Method (optional)</label>
            <input
              id="method"
              value={method}
              onChange={(event) => setMethod(event.target.value.toLowerCase())}
              placeholder="e.g. bank, proxy"
            />
          </div>
          <div>
            <label htmlFor="channel">Channel (optional)</label>
            <input
              id="channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value.toLowerCase())}
              placeholder="e.g. local, wire"
            />
          </div>
        </div>
        <textarea value={payload} onChange={(event) => setPayload(event.target.value)} />
        <button
          className="primary"
          type="button"
          onClick={handleValidateSubmit}
          disabled={validateLoading}
        >
          {validateLoading ? 'Validating...' : 'Validate Payload'}
        </button>
        {validateError && <div className="error-text">{validateError}</div>}
        {validateResult && (
          <div className="validation-output" style={{ marginTop: '1.5rem' }}>
            {JSON.stringify(validateResult, null, 2)}
          </div>
        )}
      </section>
    </div>
  );
}
