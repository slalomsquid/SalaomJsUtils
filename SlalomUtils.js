export async function readJson(relativePath, fallback = {}) {
  const filePath = path.join(__dirname, relativePath);

  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    const raw = await readFile(filePath, "utf8");
    
    // FIX: Check if the file is empty or just whitespace
    if (!raw.trim()) {
      console.warn(`File at ${relativePath} is empty. Using fallback.`);
      return fallback;
    }

    return JSON.parse(raw);
  } catch (err) {
    // Handle "File Not Found"
    if (err.code === "ENOENT") {
      const defaultValue = JSON.stringify(fallback, null, 2);
      await writeFile(filePath, defaultValue, "utf8");
      return fallback;
    }
    
    // Handle "Broken JSON" (like a half-written file)
    if (err instanceof SyntaxError) {
      console.error(`Syntax error in ${relativePath}:`, err.message);
      return fallback; 
    }

    throw err;
  }
};

export async function writeJson(relativePath, obj) {
  const filePath = path.join(__dirname, relativePath);

  // ensure parent directory exists
  await mkdir(path.dirname(filePath), { recursive: true });

  await writeFile(
    filePath,
    JSON.stringify(obj, null, 2),
    "utf8"
  );
};

function hashPair(a, b) {
    // Convert inputs to BigInt to handle 64-bit math correctly
    const bigA = BigInt(a);
    const bigB = BigInt(b);

    // Map signed integers to non-negative integers (ZigZag encoding style)
    const A = bigA >= 0n ? 2n * bigA : -2n * bigA - 1n;
    const B = bigB >= 0n ? 2n * bigB : -2n * bigB - 1n;

    // Szudzik's pairing function logic
    let C;
    if (A >= B) {
        C = (A * A + A + B) / 2n;
    } else {
        C = (A + B * B) / 2n;
    }

    // Map back to signed result
    if ((bigA < 0n && bigB < 0n) || (bigA >= 0n && bigB >= 0n)) {
        return C;
    } else {
        return -C - 1n;
    }
};

export function unhashPair(hash) {
    const bigHash = BigInt(hash);
    let C, isPositive;

    // 1. Reverse the final sign mapping
    if (bigHash >= 0n) {
        C = bigHash;
        isPositive = true;
    } else {
        C = -bigHash - 1n;
        isPositive = false;
    }

    // 2. Reverse Szudzik's pairing to find A and B
    // We need the integer square root
    const doubleC = 2n * C;
    const s = bigIntSqrt(doubleC);
    let A, B;

    if (doubleC - (s * s) < s) {
        A = doubleC - (s * s);
        B = s;
    } else {
        A = s;
        B = doubleC - (s * s) - s;
    }

    // 3. Reverse the signed integer mapping (ZigZag)
    const decode = (val) => {
        return val % 2n === 0n ? val / 2n : -(val + 1n) / 2n;
    };

    // return {
    //     a: Number(decode(A)),
    //     b: Number(decode(B))
    // };
    return [Number(decode(A)), Number(decode(B))];
};

export function bigIntSqrt(value) {
    if (value < 0n) return null;
    if (value < 2n) return value;
    let x = value / 2n + 1n;
    let y = (x + value / x) / 2n;
    while (y < x) {
        x = y;
        y = (x + value / x) / 2n;
    }
    return x;
};
