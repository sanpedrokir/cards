export interface FormState {
  error?: string;
  // Set when the error is a free-plan limit, so the form can offer a Subscribe link.
  upgrade?: boolean;
}

export const initialFormState: FormState = {};
