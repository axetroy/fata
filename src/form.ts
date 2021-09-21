interface KeyValueObject {
  [key: string]: any;
}

export class FataFormData<T extends KeyValueObject = Object> {
  constructor(private _form: T) {}
  public formData(): FormData {
    const form = new FormData();

    for (const key in this._form) {
      if (this._form[key] !== undefined) {
        form.append(key, this._form[key]);
      }
    }

    return form;
  }
}

export class FataURLSearchParams<T extends KeyValueObject = Object> {
  constructor(private _form: T) {}
  public URLSearchParams(): URLSearchParams {
    const searchParams = new URLSearchParams();

    for (const key in this._form) {
      if (this._form[key] !== undefined) {
        searchParams.append(key, this._form[key]);
      }
    }

    return searchParams;
  }
}
