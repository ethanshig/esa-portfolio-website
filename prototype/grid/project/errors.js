/* An expected way for a sheet not to exist (no WebGL, a CDN that will not
   answer). env.js shows the Document quietly for these; anything else that
   stops a sheet is a bug and is reported as an error. PROTOTYPE. */
export class NoSheetError extends Error {
  constructor(message) { super(message); this.name = 'NoSheetError'; }
}
