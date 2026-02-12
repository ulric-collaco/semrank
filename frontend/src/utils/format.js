export const formatClassName = (className) => {
    if (!className) return '';
    // Replace underscores with hyphens (e.g. COMPS_A -> COMPS-A)
    return className.replace(/_/g, '-');
};
