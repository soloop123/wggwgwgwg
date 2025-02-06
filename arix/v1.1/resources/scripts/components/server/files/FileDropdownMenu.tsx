import React, { memo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisH,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'path';
import deleteFiles from '@/api/server/files/deleteFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import styled from 'styled-components/macro';
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import { useTranslation } from 'react-i18next';
import { LuTextCursor, LuMove, LuKey, LuFileArchive, LuFolderOpenDot, LuTrash2, LuCopy, LuDownload } from "react-icons/lu";

type ModalType = 'rename' | 'move' | 'chmod';

const StyledRow = styled.div<{ $danger?: boolean }>`
    ${tw`p-2 flex items-center rounded cursor-pointer`};
    ${(props) =>
        props.$danger ? tw`hover:bg-danger-100 hover:text-danger-50` : tw`hover:bg-neutral-500 hover:text-neutral-100`};
`;

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ComponentType;
    title: string;
    $danger?: boolean;
}

const Row = ({ icon: Icon, title, ...props }: RowProps) => (
    <StyledRow {...props}>
        <Icon />
        <span css={tw`ml-2`}>{title}</span>
    </StyledRow>
);

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const { t } = useTranslation('arix/server/files');
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail.clientX, e.detail.clientY);
        }
    });

    const doDeletion = () => {
        clearFlashes('files');

        // For UI speed, immediately remove the file from the listing before calling the deletion function.
        // If the delete actually fails, we'll fetch the current directory contents again automatically.
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                confirm={'Delete'}
                onConfirmed={doDeletion}
            >
                {t('you-cant-recover')}&nbsp;
                <span className={'font-semibold text-gray-50'}>{file.name}</span> {t('once-deleted')}
            </Dialog.Confirm>
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) => (
                    <div css={tw`px-4 py-2 hover:text-white`} onClick={onClick}>
                        <FontAwesomeIcon icon={faEllipsisH} />
                        {modal ? (
                            modal === 'chmod' ? (
                                <ChmodFileModal
                                    visible
                                    appear
                                    files={[{ file: file.name, mode: file.modeBits }]}
                                    onDismissed={() => setModal(null)}
                                />
                            ) : (
                                <RenameFileModal
                                    visible
                                    appear
                                    files={[file.name]}
                                    useMoveTerminology={modal === 'move'}
                                    onDismissed={() => setModal(null)}
                                />
                            )
                        ) : null}
                        <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    </div>
                )}
            >
                <Can action={'file.update'}>
                    <Row onClick={() => setModal('rename')} icon={LuTextCursor} title={t('rename')} />
                    <Row onClick={() => setModal('move')} icon={LuMove} title={t('move')} />
                    <Row onClick={() => setModal('chmod')} icon={LuKey} title={t('permissions')} />
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <Row onClick={doCopy} icon={LuCopy} title={t('copy')} />
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <Row onClick={doUnarchive} icon={LuFolderOpenDot} title={t('unarchive')} />
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <Row onClick={doArchive} icon={LuFileArchive} title={t('archive')} />
                    </Can>
                )}
                {file.isFile && <Row onClick={doDownload} icon={LuDownload} title={t('download')} />}
                <Can action={'file.delete'}>
                    <Row onClick={() => setShowConfirmation(true)} icon={LuTrash2} title={t('delete')} $danger />
                </Can>
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
