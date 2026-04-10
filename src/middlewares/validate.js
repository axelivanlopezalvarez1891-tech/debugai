// ============================================================
// [VAL] VALIDADOR CENTRALIZADO — Evita duplicación y estandariza
// ============================================================

export function validate(schema) {
  return (req, res, next) => {
    for (const [field, rules] of Object.entries(schema)) {
      const val = req.body[field];
      if (rules.required && (val === undefined || val === null || val === '')) {
        return res.status(400).json({ ok: false, msg: `Campo '${field}' requerido.` });
      }
      if (val !== undefined) {
        if (rules.type && typeof val !== rules.type) {
          return res.status(400).json({ ok: false, msg: `Campo '${field}' debe ser ${rules.type}.` });
        }
        if (rules.maxLen && typeof val === 'string' && val.length > rules.maxLen) {
          return res.status(400).json({ ok: false, msg: `'${field}' excede el máximo de ${rules.maxLen} caracteres.` });
        }
        if (rules.minLen && typeof val === 'string' && val.length < rules.minLen) {
          return res.status(400).json({ ok: false, msg: `'${field}' requiere mínimo ${rules.minLen} caracteres.` });
        }
        if (rules.isArray === false && Array.isArray(val)) {
          return res.status(400).json({ ok: false, msg: `'${field}' no puede ser un array.` });
        }
      }
    }
    next();
  };
}
