export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export const truncateStr = (value: string, maxLength: number = 50) => {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
};

export const getInitials = (name: string) => {
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const getRandomColor = (value: number) => {
  const colors = [
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC',
    '#81C784', '#AED581', '#FFB74D', '#FF8A65', '#A1887F'
  ];
  return colors[value % colors.length];
};

