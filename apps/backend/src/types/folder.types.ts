import { Type } from "class-transformer";
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import {
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class FolderIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("folderId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("folderId") })
    folderId!: number;
}

export class CreateFolderRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @MaxLength(MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name!: string;

    // Optional parent folder. Absent or null means a root-level folder.
    @IsOptional()
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("parentId") })
    parentId?: number | null;
}

export class UpdateFolderRequest {
    // Rename is optional so a pure move (parentId only) is also a valid update.
    @IsOptional()
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @MaxLength(MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name?: string;

    // Move target. Absent means "leave parent unchanged"; null means "move to root".
    @IsOptional()
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("parentId") })
    parentId?: number | null;
}

export class MoveProjectRequest {
    // Target folder for the project, or null to remove it from any folder (ungrouped).
    @ValidateIf((object: MoveProjectRequest) => object.folderId !== null)
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("folderId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("folderId") })
    folderId!: number | null;
}

export interface FolderResponse {
    id: number;
    name: string;
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
}
