import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    List,
    ListItem,
    ListItemText,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import { useHistory } from "react-router";
import { green } from "@mui/material/colors";
import { Add, CheckCircle } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { IconButton } from "./icon-button.component";

export const ThreatAccordion = ({ language, threat, project, onDeleteMeasure }) => {
    const {
        id,
        name,
        projectId,
        measures,
        damage,
        probability,
        newDamage,
        newProbability,
        newRisk,
        activeMeasures,
        pointOfAttack,
        measuresDone,
        componentName,
    } = threat;
    const history = useHistory();
    const { t } = useTranslation("threatsPage");
    const handleToggleSwitch = (e, checked, measure) => {
        if (checked) {
            history.push(`/projects/${projectId}/risk/measures/add`, {
                measure: {
                    ...measure,
                    threatId: threat.id,
                    threatDamage: threat.damage < newDamage ? threat.damage : newDamage,
                    threatProbability: threat.probability < newProbability ? threat.probability : newProbability,
                    projectId: project.id,
                },
                project,
            });
        } else {
            onDeleteMeasure(e, measure);
        }
    };

    const onClickAddMeasure = () => {
        history.push(`/projects/${projectId}/risk/measures/add`, {
            measure: {
                active: false,
                catalogMeasureId: undefined,
                damage: undefined,
                description: "",
                id: undefined,
                name: "",
                probability: undefined,
                scheduledAt: undefined,
                threatId: id,
                threatDamage: threat.damage < newDamage ? threat.damage : newDamage,
                threatProbability: threat.probability < newProbability ? threat.probability : newProbability,
                projectId: project.id,
            },
            project,
        });
    };

    const measuresColor = measuresDone ? green[600] : "text.primary";
    const damageColor = damage > newDamage ? green[600] : "text.primary";
    const damageValue = newDamage;
    const probabilityColor = probability > newProbability ? green[600] : "text.primary";
    const probabilityValue = newProbability;

    return (
        <Accordion>
            <AccordionSummary>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <TextCard
                        title={componentName + " | " + t(`pointsOfAttackList.${pointOfAttack}`)}
                        fontWeight="initial"
                        textProps={{
                            align: "left",
                        }}
                        captionProps={{
                            textAlign: "left",
                        }}
                    >
                        {name}
                    </TextCard>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            pr: 1,
                        }}
                    >
                        {measuresDone && <CheckCircle sx={{ color: measuresColor }} />}
                        <TextCard sx={{ ml: 2 }} title={t("measures")} color={measuresColor}>
                            {activeMeasures}/{measures.length}
                        </TextCard>
                        <TextCard sx={{ ml: 1 }} title={t("probability")} color={probabilityColor}>
                            {probabilityValue}
                        </TextCard>
                        <TextCard sx={{ ml: 1, minWidth: 50 }} title={t("damage")} color={damageColor}>
                            {damageValue}
                        </TextCard>
                        <TextCard sx={{ ml: 1, minWidth: 50 }} title={t("risk")} color={damageColor}>
                            {newRisk}
                        </TextCard>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 1,
                            paddingRight: 1,
                        }}
                    >
                        <Typography>{t("measures")}</Typography>
                        <IconButton
                            onClick={onClickAddMeasure}
                            sx={{
                                ml: 1,
                                "&:hover": {
                                    color: "secondary.main",
                                    bgcolor: "background.paper",
                                },
                                color: "text.primary",
                            }}
                        >
                            <Tooltip title={t("addMeasureBtn")}>
                                <Add sx={{ fontSize: 18 }} />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <List>
                        {measures.map((measure, i) => {
                            const { active, name, scheduledAt, damage, probability } = measure;
                            return (
                                <ListItem key={i} dense divider>
                                    <Switch
                                        onChange={(e, value) => handleToggleSwitch(e, value, measure)}
                                        checked={active}
                                        disabled={scheduledAt && !active}
                                    />
                                    <ListItemText primary={name} />
                                    {scheduledAt && (
                                        <>
                                            <TextCard sx={{ ml: 1 }} title={t("scheduledAt")}>
                                                {scheduledAt.toISOString().split("T")[0]}
                                            </TextCard>
                                            <TextCard sx={{ ml: 1 }} title={t("newProbability")}>
                                                {probability}
                                            </TextCard>
                                            <TextCard sx={{ ml: 1 }} title={t("newDamage")}>
                                                {damage}
                                            </TextCard>
                                        </>
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};

const TextCard = ({ color, title, fontWeight = 700, children, textProps, captionProps = {}, ...props }) => {
    return (
        <Box {...props}>
            <Typography align="center" sx={{ fontWeight, color }} {...textProps}>
                {children}
            </Typography>
            <Typography
                align="center"
                sx={{
                    display: "block",
                    color,
                    width: "100%",
                    ...captionProps,
                }}
                variant="caption"
            >
                {title}
            </Typography>
        </Box>
    );
};
