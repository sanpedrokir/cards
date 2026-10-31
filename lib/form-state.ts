export interface FormState {
  error?: string;
  // Neutral result text (e.g. "Updated 5 of 6 cards").
  message?: string;
  // Set when the error is a free-plan limit, so the form can offer a Subscribe link.
  upgrade?: boolean;
  // Set when the account is gone, so the form can clear the local session.
  done?: boolean;
}

export const initialFormState: FormState = {};
