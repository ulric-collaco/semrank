export const formatClassName = (className) => {
    if (!className) return '';
    return className.replace(/_/g, '-');
};
