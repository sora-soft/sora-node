export enum ExportStrategy {
  Route = 'route',
  Entity = 'entity',
  Generic = 'generic',
  Enum = 'enum',
}

export interface MethodDecorationInfo {
  methodName: string;
  modes: string[] | null;
  isRouteMethod: boolean;
}

export interface PropertyDecorationInfo {
  propertyName: string;
  modes: string[] | null;
}

export interface ExportClassInfo {
  filePath: string;
  className: string;
  strategy: ExportStrategy;
  modes: string[];
  methodDecorations: MethodDecorationInfo[];
  propertyDecorations: PropertyDecorationInfo[];
}

export interface ExportEnumInfo {
  filePath: string;
  enumName: string;
  modes: string[];
}

export interface ExportPlan {
  routes: ExportClassInfo[];
  entities: ExportClassInfo[];
  generics: ExportClassInfo[];
  enums: ExportEnumInfo[];
}

export interface RouteExportInfo {
  className: string;
  methods: Array<{
    name: string;
    params: Array<{name: string; type: any}>;
    returnType: any;
  }>;
}

export interface EntityExportInfo {
  className: string;
  properties: Array<{name: string; type: any}>;
}

export interface GenericExportInfo {
  className: string;
  methods: Array<{name: string; type: any}>;
  properties: Array<{name: string; type: any}>;
}
