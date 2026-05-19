import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateIkmPeriodDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @IsInt()
  @IsIn([1, 2])
  semester!: number;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

export class SubmitIkmSurveyDto {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  opdName!: string;

  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  submissionId?: string;

  @IsInt() @Min(1) @Max(4) u1!: number;
  @IsInt() @Min(1) @Max(4) u2!: number;
  @IsInt() @Min(1) @Max(4) u3!: number;
  @IsInt() @Min(1) @Max(4) u4!: number;
  @IsInt() @Min(1) @Max(4) u5!: number;
  @IsInt() @Min(1) @Max(4) u6!: number;
  @IsInt() @Min(1) @Max(4) u7!: number;
  @IsInt() @Min(1) @Max(4) u8!: number;
  @IsInt() @Min(1) @Max(4) u9!: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class IkmSurveyQueryDto {
  @IsString()
  @IsOptional()
  periodId?: string;

  @IsString()
  @IsOptional()
  opdName?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;
}
