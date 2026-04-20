class Export {
  static route(modes: string[] = []) {
    return function (_target: Function) {};
  }

  static entity(modes: string[] = []) {
    return function (_target: Function) {};
  }

  static declare(modes: string[] = []) {
    return function (_target: Function) {};
  }

  static ignore(modes: string[] = []) {
    return function (_target: any, _propertyKey: string, _descriptor?: PropertyDescriptor) {};
  }
}

export {Export};
