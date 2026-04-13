(function () {
  "use strict";

  const OP_MAP = { "+": "+", "−": "-", "×": "*", "÷": "/" };
  const OP_DISPLAY = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.getElementById("keys");

  let current = "0";
  let stored = null;
  let pendingOp = null;
  let fresh = true;
  let lastOp = null;
  let lastOperand = null;

  function formatDisplay(value) {
    if (value === "Error") return "오류";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    const s = String(value);
    if (s.length > 12) {
      const exp = n.toExponential(6);
      return exp.length > 12 ? n.toExponential(4) : exp;
    }
    return s;
  }

  function updateUI() {
    displayEl.textContent = formatDisplay(current);
    if (stored !== null && pendingOp) {
      const a = formatDisplay(String(stored));
      const op = OP_DISPLAY[pendingOp] || pendingOp;
      expressionEl.textContent = `${a} ${op}`;
    } else {
      expressionEl.textContent = "";
    }
  }

  function applyOp(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function commitPending(saveForRepeat) {
    if (stored === null || !pendingOp) return;
    const a = Number(stored);
    const b = Number(current);
    const op = pendingOp;
    const result = applyOp(a, b, op);
    if (!Number.isFinite(result)) {
      current = "Error";
      stored = null;
      pendingOp = null;
      fresh = true;
      lastOp = null;
      lastOperand = null;
      return;
    }
    current = String(result);
    if (saveForRepeat) {
      lastOp = op;
      lastOperand = String(b);
    }
    stored = null;
    pendingOp = null;
    fresh = true;
  }

  function inputDigit(d) {
    if (current === "Error") {
      current = d;
      fresh = false;
      lastOp = null;
      lastOperand = null;
      return;
    }
    if (fresh) {
      lastOp = null;
      lastOperand = null;
      current = d;
      fresh = false;
    } else {
      if (current === "0" && d !== "0") current = d;
      else if (current === "0" && d === "0") return;
      else if (current.replace(".", "").length < 14) current += d;
    }
  }

  function inputDecimal() {
    if (current === "Error") return;
    if (fresh) {
      lastOp = null;
      lastOperand = null;
      current = "0.";
      fresh = false;
      return;
    }
    if (!current.includes(".")) current += ".";
  }

  function clearAll() {
    current = "0";
    stored = null;
    pendingOp = null;
    fresh = true;
    lastOp = null;
    lastOperand = null;
  }

  function toggleSign() {
    if (current === "Error") return;
    if (current === "0") return;
    lastOp = null;
    lastOperand = null;
    if (current.startsWith("-")) current = current.slice(1);
    else current = "-" + current;
  }

  function percent() {
    if (current === "Error") return;
    lastOp = null;
    lastOperand = null;
    const n = Number(current) / 100;
    current = String(n);
    fresh = true;
  }

  function setOperator(opSymbol) {
    const op = OP_MAP[opSymbol] || opSymbol;
    if (current === "Error") return;
    lastOp = null;
    lastOperand = null;

    if (stored !== null && pendingOp && !fresh) {
      commitPending(false);
      if (current === "Error") return;
    }

    stored = current;
    pendingOp = op;
    fresh = true;
  }

  function equals() {
    if (current === "Error") return;
    if (stored !== null && pendingOp) {
      commitPending(true);
      return;
    }
    if (lastOp !== null && lastOperand !== null) {
      const a = Number(current);
      const b = Number(lastOperand);
      const result = applyOp(a, b, lastOp);
      if (!Number.isFinite(result)) {
        current = "Error";
        lastOp = null;
        lastOperand = null;
        return;
      }
      current = String(result);
      fresh = true;
    }
  }

  function handleKeydown(e) {
    const key = e.key;
    if (key >= "0" && key <= "9") {
      e.preventDefault();
      inputDigit(key);
      updateUI();
      return;
    }
    if (key === "." || key === ",") {
      e.preventDefault();
      inputDecimal();
      updateUI();
      return;
    }
    if (key === "Enter" || key === "=") {
      e.preventDefault();
      equals();
      updateUI();
      return;
    }
    if (key === "Escape") {
      e.preventDefault();
      clearAll();
      updateUI();
      return;
    }
    if (key === "Backspace") {
      e.preventDefault();
      if (current === "Error") {
        clearAll();
      } else if (!fresh && current.length > 1) {
        current = current.slice(0, -1);
      } else {
        current = "0";
        fresh = true;
      }
      updateUI();
      return;
    }
    const opKeys = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷",
    };
    if (opKeys[key]) {
      e.preventDefault();
      setOperator(opKeys[key]);
      updateUI();
    }
  }

  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case "digit":
        inputDigit(btn.dataset.digit);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      case "operator":
        setOperator(btn.dataset.op);
        break;
      case "equals":
        equals();
        break;
      default:
        break;
    }
    updateUI();
  });

  document.addEventListener("keydown", handleKeydown);

  updateUI();
})();
