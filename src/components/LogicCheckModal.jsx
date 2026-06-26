import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Play, AlertCircle, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '../lib/apiClient';

const TEMPLATE_PLACEHOLDER = `function countPositives(numbers):
    count = 0
    for each num in numbers:
        if num > 0:
            count = count + 1
    return count`;

export default function LogicCheckModal({ open, question, onClose }) {
  const [pseudocode, setPseudocode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const checkLogicMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiPost('/progress/logic-check', payload);
      return response.data;
    },
    onError: (err) => {
      toast.error(err.message || 'AI service is busy, please try again.');
    },
    onSuccess: (data) => {
      if (data.untranslatable) {
        toast.error('AI was unable to translate your pseudocode. Please add more details.');
      } else if (data.overallPassed) {
        toast.success('🎯 Brilliant! All test cases cleared!');
      } else {
        toast.error('❌ Mismatch detected. Please review the failed test cases.');
      }
    },
  });

  if (!open || !question) {
    return null;
  }

  const handleRun = () => {
    const codeToSubmit = pseudocode.trim();
    if (!codeToSubmit) {
      toast.error('Please enter your pseudocode first.');
      return;
    }
    checkLogicMutation.mutate({
      questionId: question.id,
      pseudocode: codeToSubmit,
    });
  };

  const results = checkLogicMutation.data;
  const isChecking = checkLogicMutation.isPending;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="notes-modal logic-check-modal auth-entrance"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logic-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notes-modal-header">
          <div>
            <p className="notes-modal-kicker">Logic Check Mode</p>
            <h3 id="logic-modal-title">{question.title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close validator">
            <X size={18} />
          </button>
        </div>

        <div className="logic-check-body">
          <p className="logic-check-desc">
            Type your indentation-based pseudocode. The AI will translate it <strong>literally</strong> (preserving any bugs you write) and execute it against test cases.
          </p>

          <div className="logic-check-template">
            <span>Expected format example:</span>
            <pre>{TEMPLATE_PLACEHOLDER}</pre>
          </div>

          <textarea
            className="notes-textarea logic-check-textarea"
            value={pseudocode}
            onChange={(e) => setPseudocode(e.target.value)}
            placeholder="Type your pseudocode here..."
            disabled={isChecking}
            rows={10}
          />

          <div className="logic-check-actions">
            <button className="ghost-button" type="button" onClick={onClose} disabled={isChecking}>
              Cancel
            </button>
            <button className="auth-button logic-check-run-btn" type="button" onClick={handleRun} disabled={isChecking}>
              <Play size={16} />
              {isChecking ? 'Checking logic...' : 'Check My Logic'}
            </button>
          </div>

          {checkLogicMutation.isError && (
            <div className="logic-result-error">
              <AlertCircle size={18} />
              <span>AI Service is currently busy. Please try again.</span>
            </div>
          )}

          {results && (
            <div className="logic-check-results-panel">
              {results.untranslatable ? (
                <div className="logic-result-warn">
                  <AlertCircle size={18} />
                  <span>The AI could not translate this pseudocode. Try defining a function with variables and return statements.</span>
                </div>
              ) : (
                <>
                  <div className={`logic-overall-status ${results.overallPassed ? 'status-pass' : 'status-fail'}`}>
                    {results.overallPassed ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <strong>{results.overallPassed ? 'ALL TEST CASES PASSED!' : 'LOGIC CHECK FAILED'}</strong>
                  </div>

                  {results.assumptions && results.assumptions.length > 0 && (
                    <div className="logic-assumptions">
                      <div className="logic-assumptions-title">
                        <Sparkles size={14} />
                        <span>AI Assumptions Made:</span>
                      </div>
                      <ul>
                        {results.assumptions.map((asm, idx) => (
                          <li key={idx}>{asm}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="logic-test-cases">
                    <h4>Test Case Results:</h4>
                    <div className="test-cases-list">
                      {results.results && results.results.map((tc, idx) => (
                        <div key={idx} className={`test-case-item ${tc.passed ? 'tc-pass' : 'tc-fail'}`}>
                          <div className="tc-header">
                            <span>Test Case #{tc.testCaseId}</span>
                            <span className="tc-badge">{tc.passed ? 'Passed' : 'Failed'}</span>
                          </div>
                          {!tc.passed && (
                            <div className="tc-details">
                              <div>
                                <span>Input:</span>
                                <pre>{typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}</pre>
                              </div>
                              <div>
                                <span>Expected:</span>
                                <pre>{typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected}</pre>
                              </div>
                              <div>
                                <span>Actual Output:</span>
                                <pre className="actual-pre">{typeof tc.actual === 'object' ? JSON.stringify(tc.actual) : String(tc.actual)}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="logic-generated-code-section">
                    <button
                      className="logic-toggle-code-btn"
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                    >
                      <span>Show Literal Python Translation</span>
                      <ChevronDown className={`chevron-transition ${showCode ? 'is-rotated' : ''}`} size={16} />
                    </button>
                    {showCode && (
                      <div className="logic-generated-code-wrap">
                        <pre>{results.generatedCode}</pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
