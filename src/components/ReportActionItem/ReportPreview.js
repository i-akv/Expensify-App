import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import Text from '../Text';
import Icon from '../Icon';
import * as Expensicons from '../Icon/Expensicons';
import styles from '../../styles/styles';
import reportActionPropTypes from '../../pages/home/report/reportActionPropTypes';
import withLocalize, {withLocalizePropTypes} from '../withLocalize';
import compose from '../../libs/compose';
import ONYXKEYS from '../../ONYXKEYS';
import ControlSelection from '../../libs/ControlSelection';
import * as DeviceCapabilities from '../../libs/DeviceCapabilities';
import {showContextMenuForReport} from '../ShowContextMenuContext';
import * as StyleUtils from '../../styles/StyleUtils';
import * as ReportUtils from '../../libs/ReportUtils';
import Navigation from '../../libs/Navigation/Navigation';
import ROUTES from '../../ROUTES';
import SettlementButton from '../SettlementButton';
import getButtonState from '../../libs/getButtonState';
import * as IOU from '../../libs/actions/IOU';
import refPropTypes from '../refPropTypes';
import PressableWithoutFeedback from '../Pressable/PressableWithoutFeedback';

const propTypes = {
    /** All the data of the action */
    action: PropTypes.shape(reportActionPropTypes).isRequired,

    /** The associated chatReport */
    chatReportID: PropTypes.string.isRequired,

    /** The active IOUReport, used for Onyx subscription */
    // eslint-disable-next-line react/no-unused-prop-types
    iouReportID: PropTypes.string.isRequired,

    /* Onyx Props */
    /** chatReport associated with iouReport */
    chatReport: PropTypes.shape({
        /** The participants of this report */
        participants: PropTypes.arrayOf(PropTypes.string),

        /** Whether the chat report has an outstanding IOU */
        hasOutstandingIOU: PropTypes.bool.isRequired,
    }),

    /** Active IOU Report for current report */
    iouReport: PropTypes.shape({
        /** Email address of the manager in this iou report */
        managerEmail: PropTypes.string,

        /** Email address of the creator of this iou report */
        ownerEmail: PropTypes.string,

        /** Outstanding amount in cents of this transaction */
        total: PropTypes.number,

        /** Currency of outstanding amount of this transaction */
        currency: PropTypes.string,

        /** Does the iouReport have an outstanding IOU? */
        hasOutstandingIOU: PropTypes.bool,
    }),

    /** Session info for the currently logged in user. */
    session: PropTypes.shape({
        /** Currently logged in user email */
        email: PropTypes.string,
    }),

    /** Popover context menu anchor, used for showing context menu */
    contextMenuAnchor: refPropTypes,

    /** Callback for updating context menu active state, used for showing context menu */
    checkIfContextMenuActive: PropTypes.func,

    /** Whether the IOU is hovered so we can modify its style */
    isHovered: PropTypes.bool,

    ...withLocalizePropTypes,
};

const defaultProps = {
    contextMenuAnchor: null,
    isHovered: false,
    chatReport: {},
    iouReport: {},
    checkIfContextMenuActive: () => {},
    session: {
        email: null,
    },
};

function ReportPreview(props) {
    const managerEmail = props.iouReport.managerEmail || '';
    const isCurrentUserManager = managerEmail === lodashGet(props.session, 'email', null);
    const bankAccountRoute = ReportUtils.getBankAccountRoute(props.chatReport);
    const displayingMessage = ReportUtils.getMoneyRequestReportActionMessage(props.iouReport, props.action);
    return (
        <View style={[styles.chatItemMessage]}>
            <PressableWithoutFeedback
                onPress={() => {
                    Navigation.navigate(ROUTES.getReportRoute(props.iouReportID));
                }}
                onPressIn={() => DeviceCapabilities.canUseTouchScreen() && ControlSelection.block()}
                onPressOut={() => ControlSelection.unblock()}
                onLongPress={(event) => showContextMenuForReport(event, props.contextMenuAnchor, props.chatReportID, props.action, props.checkIfContextMenuActive)}
                style={[styles.flexRow, styles.justifyContentBetween]}
                accessibilityRole="button"
                accessibilityLabel={props.translate('iou.viewDetails')}
            >
                <View style={[styles.flexShrink1]}>
                    <Text style={[styles.chatItemMessage, styles.cursorPointer, styles.colorMuted]}>{displayingMessage}</Text>
                </View>
                <Icon
                    src={Expensicons.ArrowRight}
                    fill={StyleUtils.getIconFillColor(getButtonState(props.isHovered))}
                />
            </PressableWithoutFeedback>
            {isCurrentUserManager && !ReportUtils.isSettled(props.iouReport.reportID) && (
                <SettlementButton
                    currency={props.iouReport.currency}
                    policyID={props.iouReport.policyID}
                    chatReportID={props.chatReportID}
                    iouReport={props.iouReport}
                    onPress={(paymentType) => IOU.payMoneyRequest(paymentType, props.chatReport, props.iouReport)}
                    enablePaymentsRoute={ROUTES.BANK_ACCOUNT_NEW}
                    addBankAccountRoute={bankAccountRoute}
                    style={[styles.requestPreviewBox]}
                />
            )}
        </View>
    );
}

ReportPreview.propTypes = propTypes;
ReportPreview.defaultProps = defaultProps;
ReportPreview.displayName = 'ReportPreview';

export default compose(
    withLocalize,
    withOnyx({
        chatReport: {
            key: ({chatReportID}) => `${ONYXKEYS.COLLECTION.REPORT}${chatReportID}`,
        },
        iouReport: {
            key: ({iouReportID}) => `${ONYXKEYS.COLLECTION.REPORT}${iouReportID}`,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
    }),
)(ReportPreview);
