import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidateNested,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

function IsNotBothWith(property: string, validationOptions?: ValidationOptions) {
  return function register(object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotBothWith',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          return value === undefined || value === null || relatedValue === undefined || relatedValue === null;
        },
      },
    });
  };
}

export class SopEvidenceInputDto {
  @IsUUID()
  dmsDocumentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class CreateSopRealizationDto {
  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  @IsNotBothWith('quarter', {
    message: 'Pilih salah satu periode saja: bulan atau triwulan.',
  })
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  quarter?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  realizationQuantity!: number;

  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  qualityPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeStatus?: string;

  @IsString()
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  constraint?: string;

  @IsOptional()
  @IsString()
  followUp?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SopEvidenceInputDto)
  evidence?: SopEvidenceInputDto[];
}
