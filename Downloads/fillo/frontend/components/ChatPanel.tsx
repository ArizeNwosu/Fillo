'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { mapValues } from '../lib/api';
import { useFormStore } from '../lib/store';
import { formatFieldValue } from '../lib/validators';
import { ChatMessage, FieldDefinition } from '../lib/types';
import { MicButton } from './MicButton';

const HIGHLIGHT_TIMEOUT = 1500;

export function ChatPanel() {
  const {
    formId,
    schema,
    messages,
    currentValues,
    highlighted,
    addMessage,
    applyMapResult,
    recordSnapshot,
    undoSnapshot,
    setHighlighted
  } = useFormStore();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (highlighted.length === 0) {
      return;
    }
    const timer = setTimeout(() => setHighlighted([]), HIGHLIGHT_TIMEOUT);
    return () => clearTimeout(timer);
  }, [highlighted, setHighlighted]);

  const fieldLookup = useMemo(() => {
    if (!schema) return {} as Record<string, FieldDefinition>;
    return Object.fromEntries(schema.fields.map((field) => [field.id, field]));
  }, [schema]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formId || input.trim() === '') {
      return;
    }
    setIsSending(true);
    setError(null);
    recordSnapshot();

    const userMessage: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: input.trim()
    };
    addMessage(userMessage);

    try {
      const result = await mapValues(formId, input.trim(), 'append');
      applyMapResult(result);
      addMessage({
        id: uuid(),
        role: 'assistant',
        content:
          Object.keys(result.applied_values).length > 0
            ? 'Applied your update.'
            : 'I could not match that to any fields.',
        meta: { unmatched: result.unmatched_entities }
      });
      setInput('');
    } catch (err) {
      console.error(err);
      setError('Unable to map the provided information.');
      addMessage({
        id: uuid(),
        role: 'system',
        content: 'Mapping failed. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUndo = async () => {
    if (!formId) return;
    const snapshot = undoSnapshot();
    if (!snapshot) {
      return;
    }
    try {
      const result = await mapValues(formId, JSON.stringify(snapshot), 'replace');
      applyMapResult(result);
      addMessage({
        id: uuid(),
        role: 'assistant',
        content: 'Reverted to the previous state.'
      });
    } catch (err) {
      console.error(err);
      setError('Unable to undo the last change.');
    }
  };

  const handleClear = async () => {
    if (!formId) return;
    recordSnapshot();
    try {
      const result = await mapValues(formId, '{}', 'replace');
      applyMapResult(result);
      addMessage({ id: uuid(), role: 'assistant', content: 'Cleared all fields.' });
    } catch (err) {
      console.error(err);
      setError('Unable to clear the form.');
    }
  };

  const handleTranscript = (text: string) => {
    setInput((prev) => `${prev} ${text}`.trim());
  };

  const renderFieldSummary = () => {
    if (!schema || Object.keys(currentValues).length === 0) {
      return null;
    }
    return (
      <div className="rounded-md bg-slate-900/60 p-3 text-sm">
        <div className="mb-2 font-semibold text-slate-300">Current values</div>
        <ul className="space-y-1">
          {Object.entries(currentValues).map(([fieldId, value]) => {
            const field = fieldLookup[fieldId];
            if (!field) return null;
            return (
              <li key={fieldId} className={highlighted.includes(fieldId) ? 'text-emerald-400' : 'text-slate-200'}>
                <span className="font-medium">{field.label}:</span> {formatFieldValue(field, value)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 overflow-y-auto rounded-lg bg-slate-900/70 p-4 shadow-inner">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">
            Upload a PDF and describe the values you want to fill. I will map them to the form fields automatically.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.id} className="text-sm text-slate-200">
                <span className="mr-2 uppercase tracking-wide text-slate-400">{message.role}:</span>
                <span>{message.content}</span>
                {message.meta?.unmatched && Array.isArray(message.meta.unmatched) && message.meta.unmatched.length > 0 && (
                  <div className="mt-1 text-xs text-amber-300">
                    Could not match: {message.meta.unmatched.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {renderFieldSummary()}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (formId && input.trim() !== '' && !isSending) {
                handleSubmit(event as any);
              }
            }
          }}
          placeholder={formId ? 'Describe the information to add to the form… (Press Enter to send, Shift+Enter for new line)' : 'Upload a PDF to begin.'}
          disabled={!formId || isSending}
          className="h-24 w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
        />
        {error && <div className="text-xs text-rose-400">{error}</div>}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!formId || isSending}
              className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!formId || isSending}
              className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <MicButton disabled={!formId || isSending} onTranscript={handleTranscript} />
            <button
              type="submit"
              disabled={!formId || isSending || input.trim() === ''}
              className="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
